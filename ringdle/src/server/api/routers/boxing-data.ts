import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import type { BoxingDataFighter, BoxingDataFighterTitle } from "./types/boxing-data.types";
import type { Fighter } from "../../../../generated/prisma";

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
    height_ft: f.heightFt,
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
  getRandomFighter: publicProcedure
    .query(async () => {
      const fighters = await db.fighter.findMany();

      if (fighters.length === 0) {
        throw new Error("No fighters in database");
      }

      const random = fighters[Math.floor(Math.random() * fighters.length)]!;
      return toBoxingDataFighter(random);
    }),
  
  // Search for a fighter by name
  searchFighters: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const fighters = await db.fighter.findMany({
        where: { name: { contains: input.query} },
        take: 10,
      });
      return fighters.map(toBoxingDataFighter);
    }),
});