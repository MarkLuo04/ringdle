import { cn } from "@/lib/utils";
import { Table } from "~/components/retroui/Table";
import type { BoxingDataFighter } from "~/server/api/routers/types/boxing-data.types";
import type { GuessResult, CellResult } from "~/lib/compareFighters";

export type GuessEntry = { fighter: BoxingDataFighter; result: GuessResult };

const COLUMNS = [
  { label: "Name", key: "name", className: "min-w-[8rem]" },
  { label: "Nationality", key: "nationality", className: "min-w-[6rem]" },
  { label: "Division", key: "division", className: "min-w-[7rem]" },
  { label: "Stance", key: "stance", className: "min-w-[5rem]" },
  { label: "Height", key: "height", className: "min-w-[4.5rem]" },
  { label: "Age", key: "age", className: "min-w-[3.5rem]" },
  { label: "Debut", key: "debut", className: "min-w-[4rem]" },
  { label: "W", key: "wins", className: "min-w-[3rem]" },
  { label: "L", key: "losses", className: "min-w-[3rem]" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

const DIRECTION_COLUMNS = new Set<ColumnKey>([
  "height",
  "age",
  "debut",
  "wins",
  "losses",
]);

function cellBg(status: CellResult["status"]): string {
  const retro =
    "rounded border-2 border-black font-normal shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
  if (status === "correct") return `bg-green-600 text-white ${retro}`;
  if (status === "close") return `bg-amber-500 text-white ${retro}`;
  return "";
}

function directionArrow(cell: CellResult): "↑" | "↓" | null {
  if (cell.status === "correct" || !cell.direction) return null;
  return cell.direction === "higher" ? "↑" : "↓";
}

function getCellValue(fighter: BoxingDataFighter, key: ColumnKey): string {
  switch (key) {
    case "name":
      return fighter.name;
    case "nationality":
      return fighter.nationality;
    case "division":
      return fighter.division.name;
    case "stance":
      return fighter.stance;
    case "height":
      return fighter.height_ft;
    case "age":
      return String(fighter.age);
    case "debut":
      return fighter.debut;
    case "wins":
      return String(fighter.stats.wins);
    case "losses":
      return String(fighter.stats.losses);
  }
}

interface BoxerGuessTableProps {
  guessedFighters: GuessEntry[];
}

export function BoxerGuessTable({ guessedFighters }: BoxerGuessTableProps) {
  if (guessedFighters.length === 0) return null;

  return (
    <Table className="w-max min-w-full">
      <Table.Header>
        <Table.Row>
          {COLUMNS.map((col) => (
            <Table.Head
              key={col.key}
              className={cn("text-center whitespace-nowrap", col.className)}
            >
              {col.label}
            </Table.Head>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {guessedFighters.map(({ fighter, result }) => (
          <Table.Row key={fighter.id}>
            {COLUMNS.map((col) => {
              const cell = result[col.key];
              const value = getCellValue(fighter, col.key);
              const arrow = DIRECTION_COLUMNS.has(col.key)
                ? directionArrow(cell)
                : null;
              return (
                <Table.Cell
                  key={col.key}
                  className={cn("text-center whitespace-nowrap", col.className)}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center gap-0.5 px-2 py-1 whitespace-nowrap",
                      cellBg(cell.status),
                    )}
                  >
                    <span>{value}</span>
                    {arrow && (
                      <span aria-hidden="true" className="shrink-0">
                        {arrow}
                      </span>
                    )}
                  </span>
                </Table.Cell>
              );
            })}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
