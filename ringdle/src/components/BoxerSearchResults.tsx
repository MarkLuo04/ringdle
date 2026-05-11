"use client";

import { useState, useEffect } from "react";
import { skipToken } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { compareFighters } from "~/lib/compareFighters";
import { BoxerSearchBar } from "~/components/BoxerSearchBar";
import { BoxerGuessTable, type GuessEntry } from "~/components/BoxerGuessTable";

const MAX_GUESSES = 8;

export function BoxerSearchResults() {
  const [guessedFighters, setGuessedFighters] = useState<GuessEntry[]>([]);
  const [pendingId, setPendingId]             = useState<string | null>(null);
  const [gameWon, setGameWon]                 = useState(false);
  const [gameLost, setGameLost]               = useState(false);
  const [searchKey, setSearchKey]             = useState(0);

  // staleTime: Infinity prevents any refetch that would randomize the target midgame
  const { data: targetFighter } = api.boxing.getRandomFighter.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Log target fighter for debugging
  useEffect(() => {
    if (targetFighter) {
      console.log("[Ringdle] Target fighter:", targetFighter.name, targetFighter);
    }
  }, [targetFighter]);

  const { data: fetchedFighter } = api.boxing.getFighterById.useQuery(
    pendingId !== null ? { id: pendingId } : skipToken
  );

  // Handle fetched fighter from search bar
  useEffect(() => {
    if (!fetchedFighter || !targetFighter) return;

    // Skip duplicates
    if (guessedFighters.some((e) => e.fighter.id === fetchedFighter.id)) {
      setPendingId(null);
      setSearchKey((k) => k + 1);
      return;
    }

    // Compare fetched fighter to target fighter
    const result = compareFighters(fetchedFighter, targetFighter);
    const won = Object.values(result).every((c) => c.status === "correct");

    // Update guessed fighters and game state
    const nextGuesses = [...guessedFighters, { fighter: fetchedFighter, result }];
    setGuessedFighters(nextGuesses);
    if (won) {
      setGameWon(true);
    } else if (nextGuesses.length >= MAX_GUESSES) {
      setGameLost(true);
    }

    setPendingId(null);
    setSearchKey((k) => k + 1);
  }, [fetchedFighter, targetFighter]);

  // Handle select from search bar
  function handleSelect(id: string) {
    if (!guessedFighters.some((e) => e.fighter.id === id)) {
      setPendingId(id);
    } else {
      setSearchKey((k) => k + 1);
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

      {/* Search bar */}
      {!gameWon && !gameLost && (
        <BoxerSearchBar key={searchKey} onSelect={handleSelect} />
      )}

      {/* Results table */}
      <BoxerGuessTable guessedFighters={guessedFighters} />
    </div>
  );
}
