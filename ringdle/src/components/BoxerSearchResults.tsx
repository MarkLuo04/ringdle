"use client";

import { useState, useEffect } from "react";
import { skipToken } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/useDebounce";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "~/components/ui/table";
import type { BoxingDataFighter } from "~/server/api/routers/types/boxing-data.types";
import { compareFighters, type GuessResult, type CellResult } from "~/lib/compareFighters";

const MAX_GUESSES = 8;

const COLUMNS = [
  { label: "Name",        key: "name"        },
  { label: "Nationality", key: "nationality"  },
  { label: "Division",    key: "division"     },
  { label: "Stance",      key: "stance"       },
  { label: "Height",      key: "height"       },
  { label: "Age",         key: "age"          },
  { label: "W",           key: "wins"         },
  { label: "L",           key: "losses"       },
  { label: "D",           key: "draws"        },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

// Cell background colour
function cellBg(status: CellResult["status"]): string {
  if (status === "correct") return "bg-green-600 text-white rounded";
  if (status === "close")   return "bg-yellow-400 text-black rounded";
  return "";
}

// Higher or lower indicators
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
    case "wins":        return String(fighter.stats.wins);
    case "losses":      return String(fighter.stats.losses);
    case "draws":       return String(fighter.stats.draws);
  }
}

type GuessEntry = { fighter: BoxingDataFighter; result: GuessResult };

export function BoxerSearchResults() {
  const [inputValue, setInputValue]       = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [guessedFighters, setGuessedFighters] = useState<GuessEntry[]>([]);
  const [pendingId, setPendingId]         = useState<string | null>(null);
  const [gameWon, setGameWon]             = useState(false);
  const [gameLost, setGameLost]           = useState(false);

  const debouncedInput = useDebounce(inputValue, 150);

  // Load the target fighter exactly once 
  // staleTime: Infinity prevents any refetch that would randomize the target midgame
  const { data: targetFighter } = api.boxing.getRandomFighter.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (targetFighter) {
      console.log("[Ringdle] Target fighter:", targetFighter.name, targetFighter);
    }
  }, [targetFighter]);

  // Lightweight query for dropdown suggestions
  const { data: suggestions } = api.boxing.suggestFighters.useQuery(
    { query: debouncedInput },
    { enabled: debouncedInput.length >= 2 }
  );

  // Full fetch triggered only when a suggestion is clicked
  const { data: fetchedFighter } = api.boxing.getFighterById.useQuery(
    pendingId !== null ? { id: pendingId } : skipToken
  );

  useEffect(() => {
    if (!fetchedFighter || !targetFighter) return;

    // Skip duplicates
    if (guessedFighters.some((e) => e.fighter.id === fetchedFighter.id)) {
      setPendingId(null);
      setInputValue("");
      setShowSuggestions(false);
      return;
    }

    // Compare the fetched fighter to the target fighter
    const result = compareFighters(fetchedFighter, targetFighter);
    const won = Object.values(result).every((c) => c.status === "correct");

    const nextGuesses = [...guessedFighters, { fighter: fetchedFighter, result }];
    setGuessedFighters(nextGuesses);
    if (won) {
      setGameWon(true);
    } else if (nextGuesses.length >= MAX_GUESSES) {
      setGameLost(true);
    }

    setPendingId(null);
    setInputValue("");
    setShowSuggestions(false);
  }, [fetchedFighter, targetFighter]);

  function handleSelect(id: string) {
    // If the fighter is already guessed, clear the input and suggestions
    if (!guessedFighters.some((e) => e.fighter.id === id)) {
      setPendingId(id);
    } else {
      setInputValue("");
      setShowSuggestions(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      {/* Win banner */}
      {gameWon && (
        <div className="rounded-lg border border-green-500 bg-green-50 px-6 py-4 text-center dark:bg-green-950">
          <p className="text-lg font-semibold text-green-700 dark:text-green-300">
            You got it! The boxer was{" "}
            <span className="font-bold">{targetFighter?.name}</span>.
          </p>
        </div>
      )}

      {/* Loss banner */}
      {gameLost && (
        <div className="rounded-lg border border-red-400 bg-red-50 px-6 py-4 text-center dark:bg-red-950">
          <p className="text-lg font-semibold text-red-700 dark:text-red-300">
            Out of guesses! The boxer was{" "}
            <span className="font-bold">{targetFighter?.name}</span>.
          </p>
        </div>
      )}

      {/* Guess counter */}
      {!gameWon && !gameLost && (
        <p className="text-sm text-muted-foreground text-right">
          {guessedFighters.length} / {MAX_GUESSES} guesses used
        </p>
      )}

      {/* Search bar with suggestion dropdown */}
      {!gameWon && !gameLost && (
        <Field>
          <FieldLabel>Search for a boxer</FieldLabel>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter a boxer's name..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => { if (inputValue.length >= 2) setShowSuggestions(true); }}
              className="w-full"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 rounded-md border bg-popover shadow-md">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(s.id)}
                    >
                      {s.name}
                      <span className="ml-2 text-muted-foreground text-xs">
                        {s.divisionName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>
      )}

      {/* Results table */}
      {guessedFighters.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead key={col.key} className="text-center">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {guessedFighters.map(({ fighter, result }) => (
              <TableRow key={fighter.id}>
                {COLUMNS.map((col) => {
                  const cell = result[col.key];
                  const value = getCellValue(fighter, col.key);
                  const isNumeric = ["height", "age", "wins", "losses", "draws"].includes(col.key);
                  return (
                    <TableCell key={col.key} className="text-center">
                      <span className={`inline-block px-2 py-1 ${cellBg(cell.status)}`}>
                        {value}
                        {isNumeric && directionArrow(cell)}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
