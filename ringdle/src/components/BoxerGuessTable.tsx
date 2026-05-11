import { Table } from "~/components/retroui/Table";
import type { BoxingDataFighter } from "~/server/api/routers/types/boxing-data.types";
import type { GuessResult, CellResult } from "~/lib/compareFighters";

export type GuessEntry = { fighter: BoxingDataFighter; result: GuessResult };

const COLUMNS = [
  { label: "Name",        key: "name"        },
  { label: "Nationality", key: "nationality"  },
  { label: "Division",    key: "division"     },
  { label: "Stance",      key: "stance"       },
  { label: "Height",      key: "height"       },
  { label: "Age",         key: "age"          },
  { label: "Debut",       key: "debut"        },
  { label: "W",           key: "wins"         },
  { label: "L",           key: "losses"       },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

function cellBg(status: CellResult["status"]): string {
  if (status === "correct") return "bg-green-600 text-white rounded";
  if (status === "close")   return "bg-amber-500 text-white rounded";
  return "";
}

function directionArrow(cell: CellResult): string {
  if (cell.status === "correct" || !cell.direction) return "";
  return cell.direction === "higher" ? " ↑" : " ↓";
}

function getCellValue(fighter: BoxingDataFighter, key: ColumnKey): string {
  switch (key) {
    case "name":        return fighter.name;
    case "nationality": return fighter.nationality;
    case "division":    return fighter.division.name;
    case "stance":      return fighter.stance;
    case "height":      return fighter.height_ft;
    case "age":         return String(fighter.age);
    case "debut":       return fighter.debut;
    case "wins":        return String(fighter.stats.wins);
    case "losses":      return String(fighter.stats.losses);
  }
}

interface BoxerGuessTableProps {
  guessedFighters: GuessEntry[];
}

export function BoxerGuessTable({ guessedFighters }: BoxerGuessTableProps) {
  if (guessedFighters.length === 0) return null;

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          {COLUMNS.map((col) => (
            <Table.Head key={col.key} className="text-center">
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
              const isNumeric = ["height", "age", "wins", "losses", "draws"].includes(col.key);
              return (
                <Table.Cell key={col.key} className="text-center">
                  <span className={`inline-block px-2 py-1 ${cellBg(cell.status)}`}>
                    {value}
                    {isNumeric && directionArrow(cell)}
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
