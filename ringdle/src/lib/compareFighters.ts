import type { BoxingDataFighter } from "~/server/api/routers/types/boxing-data.types";

export type CellStatus = "correct" | "close" | "wrong";

export type CellResult = {
  status: CellStatus;
  direction?: "higher" | "lower";
};

export type GuessResult = Record<
  "name" | "nationality" | "division" | "stance" | "height" | "age" | "debut" | "wins" | "losses",
  CellResult
>;

// Converts a height_ft string to total inches
function toTotalInches(ft: string): number | null {
  const [feetPart, inchesPart] = ft.split("'");
  if (!feetPart || !inchesPart) return null;
  const feet = parseInt(feetPart, 10);
  const inches = parseInt(inchesPart, 10);
  if (isNaN(feet) || isNaN(inches)) return null;
  return feet * 12 + inches;
}

// Compares height strings
function heightCell(guessFt: string, targetFt: string): CellResult {
  if (guessFt === targetFt) return { status: "correct" };
  const gIn = toTotalInches(guessFt);
  const tIn = toTotalInches(targetFt);
  if (gIn === null || tIn === null) return { status: "wrong" };
  const direction: CellResult["direction"] = tIn > gIn ? "higher" : "lower";
  // Close if within 2 total inches
  if (Math.abs(gIn - tIn) <= 2) return { status: "close", direction };
  return { status: "wrong", direction };
}

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
    height:      heightCell(guess.height_ft, target.height_ft),
    age:         numericCell(guess.age, target.age, 3),
    debut:       numericCell(parseInt(guess.debut, 10), parseInt(target.debut, 10), 3), 
    wins:        numericCell(guess.stats.wins, target.stats.wins, 5),
    losses:      numericCell(guess.stats.losses, target.stats.losses, 3),
  };
}
