import { z } from "zod";

import { Prisma } from "../../../../generated/prisma";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

function utcYesterday(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export const statsRouter = createTRPCRouter({
  recordResult: protectedProcedure
    .input(
      z.object({
        won: z.boolean(),
        guesses: z.number().int().min(1).max(8),
        fighterId: z.string().min(1),
        playedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.db.$transaction(async (tx) => {
        try {
          await tx.gameResult.create({
            data: {
              userId,
              playedDate: input.playedDate,
              won: input.won,
              guesses: input.guesses,
              fighterId: input.fighterId,
            },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2002"
          ) {
            return { recorded: false as const };
          }
          throw e;
        }

        const prev = await tx.userStats.findUnique({ where: { userId } });

        const gamesPlayed = (prev?.gamesPlayed ?? 0) + 1;
        const gamesWon = (prev?.gamesWon ?? 0) + (input.won ? 1 : 0);
        const totalGuessesOnWins =
          (prev?.totalGuessesOnWins ?? 0) + (input.won ? input.guesses : 0);

        let currentStreak = prev?.currentStreak ?? 0;
        let longestStreak = prev?.longestStreak ?? 0;
        let lastPlayedDate: string | null = prev?.lastPlayedDate ?? null;

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

        return { recorded: true as const };
      });
    }),

  getMyStats: protectedProcedure.query(async ({ ctx }) => {
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
