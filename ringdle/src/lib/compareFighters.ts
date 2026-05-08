import type { BoxingDataFighter } from "~/server/api/routers/types/boxing-data.types";

export type CellStatus = "correct" | "close" | "wrong";

export type CellResult = {
  status: CellStatus;
  direction?: "higher" | "lower";
};

export type GuessResult = Record<
  "name" | "nationality" | "division" | "stance" | "height" | "age" | "wins" | "losses" | "draws",
  CellResult
>;

function numericCell(guessVal: number, targetVal: number, closeThreshold: number): CellResult {
  if (guessVal === targetVal) return { status: "correct" };
  const direction = targetVal > guessVal ? "higher" : "lower";
  const status = Math.abs(guessVal - targetVal) <= closeThreshold ? "close" : "wrong";
  return { status, direction };
}

export function compareFighters(guess: BoxingDataFighter, target: BoxingDataFighter): GuessResult {
  // Division: correct = same division, close = weight within 15 lb, wrong = farther
  const divisionResult = (): CellResult => {
    if (guess.division.id === target.division.id) return { status: "correct" };
    const gw = guess.division.weight_lb;
    const tw = target.division.weight_lb;
    if (gw !== null && tw !== null && Math.abs(gw - tw) <= 15) {
      return { status: "close", direction: tw > gw ? "higher" : "lower" };
    }
    return { status: "wrong" };
  };

  return {
    name:        { status: guess.id === target.id ? "correct" : "wrong" },
    nationality: { status: guess.nationality === target.nationality ? "correct" : "wrong" },
    division:    divisionResult(),
    stance:      { status: guess.stance === target.stance ? "correct" : "wrong" },
    // Round to nearest inch before comparing 
    height: numericCell(Math.round(guess.height_in), Math.round(target.height_in), 2),
    // Age
    age:         numericCell(guess.age, target.age, 3),
    // wins/losses/draws
    wins:        numericCell(guess.stats.wins, target.stats.wins, 5),
    losses:      numericCell(guess.stats.losses, target.stats.losses, 3),
    draws:       numericCell(guess.stats.draws, target.stats.draws, 1),
  };
}
