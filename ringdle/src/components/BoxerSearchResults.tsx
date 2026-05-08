"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "~/components/ui/table";

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
  const [submittedQuery, setSubmittedQuery] = useState("");

  const { data: results, isFetching } = api.boxing.searchFighters.useQuery(
    { query: submittedQuery },
    { enabled: submittedQuery.length > 0 }
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) setSubmittedQuery(trimmed);
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      {/* Search bar */}
      <form onSubmit={handleSubmit}>
        <Field>
          <FieldLabel>Search for a boxer</FieldLabel>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter a boxer's name..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Search</Button>
          </div>
        </Field>
      </form>

      {/* Search results */}
      {submittedQuery && (
        <div>
          {/* Loading state */}
          {isFetching && (
            <p className="text-sm text-muted-foreground">Searching...</p>
          )}
          {!isFetching && results?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No fighters found for &quot;{submittedQuery}&quot;
            </p>
          )}
          {/* Results table */}
          {!isFetching && results && results.length > 0 && (
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
                {results.map((fighter) => (
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
      )}
    </div>
  );
}
