"use client";

import { useState, useEffect } from "react";
import { skipToken } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/useDebounce";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "~/components/ui/table";
import type { BoxingDataFighter } from "~/server/api/routers/types/boxing-data.types";

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

export function BoxerSearchResults() {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addedFighters, setAddedFighters] = useState<BoxingDataFighter[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const debouncedInput = useDebounce(inputValue, 150);

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
    if (!fetchedFighter) return;
    setAddedFighters((prev) =>
      prev.some((f) => f.id === fetchedFighter.id) ? prev : [...prev, fetchedFighter]
    );
    setPendingId(null);
    setInputValue("");
    setShowSuggestions(false);
  }, [fetchedFighter]);

  function handleSelect(id: string) {
    if (!addedFighters.some((f) => f.id === id)) {
      setPendingId(id);
    } else {
      setInputValue("");
      setShowSuggestions(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      {/* Search bar with suggestion dropdown */}
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

      {/* Results table */}
      {addedFighters.length > 0 && (
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
            {addedFighters.map((fighter) => (
              <TableRow key={fighter.id}>
                <TableCell className="font-medium text-center">{fighter.name}</TableCell>
                <TableCell className="text-center">{fighter.nationality}</TableCell>
                <TableCell className="text-center">{fighter.division.name}</TableCell>
                <TableCell className="text-center">{fighter.stance}</TableCell>
                <TableCell className="text-center">{fighter.height_ft}</TableCell>
                <TableCell className="text-center">{fighter.age}</TableCell>
                <TableCell className="text-center">{fighter.stats.wins}</TableCell>
                <TableCell className="text-center">{fighter.stats.losses}</TableCell>
                <TableCell className="text-center">{fighter.stats.draws}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
