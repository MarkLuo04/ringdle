import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { getTodayUTC, isValidArchiveDate } from "~/lib/ringdleGame";
import type {
  BoxingDataFighter,
  BoxingDataFighterTitle,
} from "./types/boxing-data.types";
import type { Fighter } from "../../../../generated/prisma";
import { getDailyFighterRecordForUtcDate } from "~/server/lib/dailyFighter";

function toBoxingDataFighter(f: Fighter): BoxingDataFighter {
  return {
    id: f.id,
    name: f.name,
    age: f.age,
    gender: f.gender,
    nickname: f.nickname ?? null,
    alias: f.alias ?? null,
    nationality: f.nationality,
    nationality_code: f.nationalityCode,
    stance: f.stance,
    debut: f.debut,
    height: f.height,
    height_cm: f.heightCm,
    height_in: f.heightIn,
    height_ft: f.heightFt.replace(/'\s+/, "'"),
    reach: f.reach,
    reach_cm: f.reachCm,
    reach_in: f.reachIn,
    stats: {
      wins: f.wins,
      losses: f.losses,
      draws: f.draws,
      total_bouts: f.totalBouts ?? undefined,
      total_rounds: f.totalRounds ?? undefined,
      ko_wins: f.koWins ?? undefined,
      stopped: f.stopped ?? undefined,
    },
    division: {
      id: f.divisionId,
      name: f.divisionName,
      weight_lb: f.divisionWeightLb ?? null,
      weight_kg: f.divisionWeightKg ?? null,
    },
    titles: JSON.parse(f.titles) as BoxingDataFighterTitle[],
  };
}

// Router for boxing data API
export const boxingRouter = createTRPCRouter({
  getFighterById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const fighter = await db.fighter.findUnique({ where: { id: input.id } });

      if (!fighter) {
        throw new Error(`Fighter with id "${input.id}" not found in database`);
      }

      return toBoxingDataFighter(fighter);
    }),

  // Get a random fighter from the database
  getRandomFighter: publicProcedure.query(async () => {
    const fighters = await db.fighter.findMany();

    if (fighters.length === 0) {
      throw new Error("No fighters in database");
    }

    const random = fighters[Math.floor(Math.random() * fighters.length)]!;
    return toBoxingDataFighter(random);
  }),

  // Get the daily fighter for a given date
  getDailyFighter: publicProcedure
    .input(
      z
        .object({
          playedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      // get the date string for the daily fighter
      const dateString = input?.playedDate ?? getTodayUTC();
      if (input?.playedDate && !isValidArchiveDate(input.playedDate)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Date out of archive range.",
        });
      }
      const { fighter } = await getDailyFighterRecordForUtcDate(dateString);
      return { fighter: toBoxingDataFighter(fighter), dateString };
    }),

  // Search for a fighter by name
  searchFighters: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const fighters = await db.fighter.findMany({
        where: { name: { contains: input.query } },
        take: 10,
      });
      return fighters.map(toBoxingDataFighter);
    }),

  // Lightweight name suggestions
  suggestFighters: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      return db.fighter.findMany({
        where: { name: { contains: input.query } },
        select: { id: true, name: true, divisionName: true },
        take: 10,
      });
    }),
});
