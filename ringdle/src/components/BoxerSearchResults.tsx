"use client";

import { useState, useEffect } from "react";
import { skipToken } from "@tanstack/react-query";
import { api } from "~/trpc/react";
import { compareFighters } from "~/lib/compareFighters";
import { BoxerSearchBar } from "~/components/BoxerSearchBar";
import { BoxerGuessTable, type GuessEntry } from "~/components/BoxerGuessTable";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { Button } from "~/components/retroui/Button";
import { HelpModal } from "~/components/HelpModal";

const MAX_GUESSES = 8;

export function BoxerSearchResults() {
  const [guessedFighters, setGuessedFighters] = useLocalStorage<GuessEntry[]>("ringdle-guesses", []);
  const [gameWon, setGameWon]                 = useLocalStorage<boolean>("ringdle-won", false);
  const [gameLost, setGameLost]               = useLocalStorage<boolean>("ringdle-lost", false);
  const [targetFighterId, setTargetFighterId] = useLocalStorage<string | null>("ringdle-target-id", null);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const utils = api.useUtils();

  // staleTime: Infinity prevents any refetch that would randomize the target midgame
  // enabled: false when a game is already in progress (targetFighterId stored)
  const { data: randomFighter } = api.boxing.getRandomFighter.useQuery(undefined, {
    enabled: targetFighterId === null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Fetch the stored target fighter by ID when returning to an existing game
  const { data: storedFighter } = api.boxing.getFighterById.useQuery(
    targetFighterId !== null ? { id: targetFighterId } : skipToken,
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    }
  );

  const targetFighter = targetFighterId !== null ? storedFighter : randomFighter;

  // Persist the random fighter's ID the first time it resolves
  useEffect(() => {
    if (randomFighter && targetFighterId === null) {
      setTargetFighterId(randomFighter.id);
    }
  }, [randomFighter]);

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

  // Reset game state
  function handleNewGame() {
    setGuessedFighters([]);
    setGameWon(false);
    setGameLost(false);
    setTargetFighterId(null);
    setPendingId(null);
    setSearchKey((k) => k + 1);
    // Clear cached random fighter so re-enabling the query fetches a new one
    void utils.boxing.getRandomFighter.reset();
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Help button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHelpOpen(true)}
          aria-label="How to play"
        >
          ? Help
        </Button>
      </div>

      {/* Win banner */}
      {gameWon && (
        <div className="rounded-lg border border-green-500 bg-green-50 px-6 py-4 text-center dark:bg-green-950">
          <p className="text-lg font-semibold text-green-700 dark:text-green-300">
            You got it! The boxer was{" "}
            <span className="font-bold">{targetFighter?.name}</span>.
          </p>
          <Button variant="outline" size="sm" onClick={handleNewGame} className="mt-3">
            New Game
          </Button>
        </div>
      )}

      {/* Loss banner */}
      {gameLost && (
        <div className="rounded-lg border border-red-400 bg-red-50 px-6 py-4 text-center dark:bg-red-950">
          <p className="text-lg font-semibold text-red-700 dark:text-red-300">
            Out of guesses! The boxer was{" "}
            <span className="font-bold">{targetFighter?.name}</span>.
          </p>
          <Button variant="outline" size="sm" onClick={handleNewGame} className="mt-3">
            New Game
          </Button>
        </div>
      )}

      {/* Search bar */}
      {!gameWon && !gameLost && (
        <BoxerSearchBar
          key={searchKey}
          onSelect={handleSelect}
          rightLabel={`${guessedFighters.length} / ${MAX_GUESSES} guesses used`}
        />
      )}

      {/* Results table */}
      <BoxerGuessTable guessedFighters={guessedFighters} />
    </div>
  );
}
