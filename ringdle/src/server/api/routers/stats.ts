import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "../../../../generated/prisma";
import { MAX_GUESSES } from "~/lib/ringdleGame";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getDailyFighterIdForUtcDate } from "~/server/lib/dailyFighter";

function utcYesterday(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

// helper function to parse guessed fighter ids column
function parseGuessedFighterIdsColumn(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    if (!v.every((x) => typeof x === "string")) return [];
    return v;
  } catch {
    return [];
  }
}

// router for retrieving today's game result
export const statsRouter = createTRPCRouter({
  getTodayGame: protectedProcedure
    .input(
      z
        .object({
          playedDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const playedDate =
        input?.playedDate ?? new Date().toISOString().slice(0, 10);
      const row = await ctx.db.gameResult.findUnique({
        where: {
          userId_playedDate: {
            userId: ctx.session.user.id,
            playedDate,
          },
        },
      });
      if (!row) return null;
      return {
        playedDate: row.playedDate,
        won: row.won,
        guesses: row.guesses,
        fighterId: row.fighterId,
        guessedFighterIds: parseGuessedFighterIdsColumn(row.guessedFighterIds),
        hintsRevealed: row.hintsRevealed,
      };
    }),

  // router for syncing completed game results
  syncCompletedGame: protectedProcedure
    .input(
      z.object({
        won: z.boolean(),
        guesses: z.number().int().min(1).max(MAX_GUESSES),
        fighterId: z.string().min(1),
        playedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        guessedFighterIds: z.array(z.string().min(1)).max(MAX_GUESSES),
        hintsRevealed: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // validate input
      if (input.guessedFighterIds.length !== input.guesses) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Guessed fighter count must match guesses.",
        });
      }
      if (
        new Set(input.guessedFighterIds).size !== input.guessedFighterIds.length
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicate guesses are not allowed.",
        });
      }
      // validate win state
      if (input.won) {
        const last = input.guessedFighterIds[input.guesses - 1];
        if (last !== input.fighterId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Win state does not match guess sequence.",
          });
        }
      } else if (input.guesses !== MAX_GUESSES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Loss state requires maximum guesses.",
        });
      }

      // validate target fighter
      const expectedTargetId = await getDailyFighterIdForUtcDate(
        input.playedDate,
      );
      if (expectedTargetId !== input.fighterId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target boxer does not match daily puzzle for that date.",
        });
      }

      // get user id
      const userId = ctx.session.user.id;

      return ctx.db.$transaction(async (tx) => {
        // check if game result already exists
        const existing = await tx.gameResult.findUnique({
          where: {
            userId_playedDate: {
              userId,
              playedDate: input.playedDate,
            },
          },
        });

        // create snapshot of game result
        const snapshot = {
          won: input.won,
          guesses: input.guesses,
          fighterId: input.fighterId,
          guessedFighterIds: JSON.stringify(input.guessedFighterIds),
          hintsRevealed: input.hintsRevealed,
        };

        // update existing game result
        if (existing) {
          await tx.gameResult.update({
            where: {
              userId_playedDate: {
                userId,
                playedDate: input.playedDate,
              },
            },
            data: snapshot,
          });
          return { recorded: "updated" as const };
        }

        // create new game result
        try {
          await tx.gameResult.create({
            data: {
              userId,
              playedDate: input.playedDate,
              ...snapshot,
            },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2002"
          ) {
            await tx.gameResult.update({
              where: {
                userId_playedDate: {
                  userId,
                  playedDate: input.playedDate,
                },
              },
              data: snapshot,
            });
            return { recorded: "updated" as const };
          }
          throw e;
        }

        // get previous user stats
        const prev = await tx.userStats.findUnique({ where: { userId } });

        // calculate new stats
        const gamesPlayed = (prev?.gamesPlayed ?? 0) + 1;
        const gamesWon = (prev?.gamesWon ?? 0) + (input.won ? 1 : 0);
        const totalGuessesOnWins =
          (prev?.totalGuessesOnWins ?? 0) + (input.won ? input.guesses : 0);

        let currentStreak = prev?.currentStreak ?? 0;
        let longestStreak = prev?.longestStreak ?? 0;
        let lastPlayedDate: string | null = prev?.lastPlayedDate ?? null;

        // update streak if the game was won
        if (input.won) {
          if (lastPlayedDate === utcYesterday(input.playedDate)) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
          lastPlayedDate = input.playedDate;
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
        } else {
          currentStreak = 0;
          lastPlayedDate = null;
        }

        // upsert user stats
        await tx.userStats.upsert({
          where: { userId },
          create: {
            userId,
            gamesPlayed,
            gamesWon,
            currentStreak,
            longestStreak,
            totalGuessesOnWins,
            lastPlayedDate,
          },
          update: {
            gamesPlayed,
            gamesWon,
            currentStreak,
            longestStreak,
            totalGuessesOnWins,
            lastPlayedDate,
          },
        });

        return { recorded: "created" as const };
      });
    }),

  // router for retrieving user statistics
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    // get user id
    const userId = ctx.session.user.id;
    const row = await ctx.db.userStats.findUnique({ where: { userId } });

    if (!row) {
      return {
        gamesPlayed: 0,
        gamesWon: 0,
        winPercentage: 0,
        currentStreak: 0,
        longestStreak: 0,
        avgGuessesOnWins: null as number | null,
      };
    }

    const winPercentage =
      row.gamesPlayed > 0 ? (row.gamesWon / row.gamesPlayed) * 100 : 0;
    const avgGuessesOnWins =
      row.gamesWon > 0 ? row.totalGuessesOnWins / row.gamesWon : null;

    return {
      gamesPlayed: row.gamesPlayed,
      gamesWon: row.gamesWon,
      winPercentage,
      currentStreak: row.currentStreak,
      longestStreak: row.longestStreak,
      avgGuessesOnWins,
    };
  }),
});
