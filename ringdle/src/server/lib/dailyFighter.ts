import type { Fighter } from "../../../generated/prisma";
import { db } from "~/server/db";

export async function getOrderedDailyFighters(): Promise<Fighter[]> {
  const fighters = await db.fighter.findMany({
    where: { dailyOrder: { not: null } },
    orderBy: { dailyOrder: "asc" },
  });

  if (fighters.length === 0) {
    throw new Error("No fighters with dailyOrder in database");
  }

  return fighters;
}

/** Epoch-day index */
export function utcDayNumberFromYyyyMmDd(playedDate: string): number {
  const parts = playedDate.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export async function getDailyFighterRecordForUtcDate(
  playedDate: string,
): Promise<{ fighter: Fighter; dateString: string }> {
  const fighters = await getOrderedDailyFighters();
  const dayNumber = utcDayNumberFromYyyyMmDd(playedDate);
  const fighter = fighters[dayNumber % fighters.length]!;
  return { fighter, dateString: playedDate };
}

export async function getDailyFighterIdForUtcDate(
  playedDate: string,
): Promise<string> {
  const { fighter } = await getDailyFighterRecordForUtcDate(playedDate);
  return fighter.id;
}
