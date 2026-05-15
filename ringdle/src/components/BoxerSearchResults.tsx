"use client";

import { useState, useEffect, useRef } from "react";
import { skipToken } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { compareFighters } from "~/lib/compareFighters";
import { BoxerSearchBar } from "~/components/BoxerSearchBar";
import { BoxerGuessTable, type GuessEntry } from "~/components/BoxerGuessTable";
import { useLocalStorage } from "~/hooks/useLocalStorage";
import { Button } from "~/components/retroui/Button";
import { HelpModal } from "~/components/HelpModal";
import { HintsPanel } from "~/components/HintsPanel";
import { StatsModal } from "~/components/StatsModal";
import { MAX_GUESSES } from "~/lib/ringdleGame";

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function msUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return midnight.getTime() - now.getTime();
}

function formatCountdown(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSecs % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSecs % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function BoxerSearchResults() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const playedDateToday = getTodayUTC();

  const { data: serverTodayGame, isPending: serverTodayPending } =
    api.stats.getTodayGame.useQuery(
      { playedDate: playedDateToday },
      {
        enabled: !!session?.user,
        staleTime: 60_000,
        refetchOnWindowFocus: true,
      },
    );

  const [guessedFighters, setGuessedFighters] = useLocalStorage<GuessEntry[]>(
    "ringdle-guesses",
    [],
  );
  const [gameWon, setGameWon] = useLocalStorage<boolean>("ringdle-won", false);
  const [gameLost, setGameLost] = useLocalStorage<boolean>(
    "ringdle-lost",
    false,
  );
  const [targetFighterId, setTargetFighterId] = useLocalStorage<string | null>(
    "ringdle-target-id",
    null,
  );
  const [hintsRevealed, setHintsRevealed] = useLocalStorage<boolean>(
    "ringdle-hints-revealed",
    false,
  );
  const [storedDate, setStoredDate] = useLocalStorage<string | null>(
    "ringdle-date",
    null,
  );

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [countdown, setCountdown] = useState<string>(
    formatCountdown(msUntilMidnightUTC()),
  );
  const resultRecordedRef = useRef(false);
  const lastServerHydrateKeyRef = useRef<string | null>(null);
  const postLoginSyncSentRef = useRef<string | null>(null);

  const syncCompletedGame = api.stats.syncCompletedGame.useMutation({
    onSuccess: (_result, variables) => {
      postLoginSyncSentRef.current = `${variables.playedDate}:${variables.guessedFighterIds.join("|")}`;
      void utils.stats.getTodayGame.invalidate();
      void utils.stats.getMyStats.invalidate();
    },
    onError: () => {
      resultRecordedRef.current = false;
    },
  });

  // On mount: read the stored date directly from localStorage
  useEffect(() => {
    const today = getTodayUTC();
    let rawDate: string | null = null;
    try {
      const item = window.localStorage.getItem("ringdle-date");
      if (item !== null) rawDate = JSON.parse(item) as string;
    } catch {
      /* ignore */
    }

    if (rawDate !== today) {
      setGuessedFighters([]);
      setGameWon(false);
      setGameLost(false);
      setTargetFighterId(null);
      setHintsRevealed(false);
      setStoredDate(null);
      resultRecordedRef.current = false;
      lastServerHydrateKeyRef.current = null;
      postLoginSyncSentRef.current = null;
    }
  }, [
    setGuessedFighters,
    setGameWon,
    setGameLost,
    setTargetFighterId,
    setHintsRevealed,
    setStoredDate,
  ]);

  // Countdown timer — only ticks while the game is over
  useEffect(() => {
    if (!gameWon && !gameLost) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(msUntilMidnightUTC()));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameWon, gameLost]);

  // Restore today's finished game from server (logged-in, cross-device).
  useEffect(() => {
    if (!session?.user || serverTodayPending) return;

    const row = serverTodayGame;
    if (row?.playedDate !== playedDateToday) return;

    const finished =
      row.won === true || row.guesses >= MAX_GUESSES;
    if (!finished) return;

    const hydrateKey = `${row.playedDate}:${row.guesses}:${row.guessedFighterIds.join("|")}:${row.hintsRevealed}`;
    if (lastServerHydrateKeyRef.current === hydrateKey) return;

    setTargetFighterId(row.fighterId);
    setStoredDate(row.playedDate);
    setGameWon(row.won);
    setGameLost(!row.won && row.guesses >= MAX_GUESSES);
    setHintsRevealed(row.hintsRevealed);

    if (row.guessedFighterIds.length === 0) {
      setGuessedFighters([]);
      lastServerHydrateKeyRef.current = hydrateKey;
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const target = await utils.boxing.getFighterById.fetch({
          id: row.fighterId,
        });
        const entries: GuessEntry[] = [];
        for (const id of row.guessedFighterIds) {
          if (cancelled) return;
          const fighter = await utils.boxing.getFighterById.fetch({ id });
          entries.push({
            fighter,
            result: compareFighters(fighter, target),
          });
        }
        if (!cancelled) {
          setGuessedFighters(entries);
          lastServerHydrateKeyRef.current = hydrateKey;
        }
      } catch {
        lastServerHydrateKeyRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    session?.user,
    serverTodayPending,
    serverTodayGame,
    playedDateToday,
    utils,
    setTargetFighterId,
    setStoredDate,
    setGameWon,
    setGameLost,
    setHintsRevealed,
    setGuessedFighters,
  ]);

  // Push anonymous completion to the server after sign-in (same device).
  useEffect(() => {
    if (!session?.user || serverTodayPending) return;

    const today = playedDateToday;
    if (!(gameWon || gameLost) || storedDate !== today) return;

    const ids = guessedFighters.map((g) => g.fighter.id);
    if (ids.length === 0 || !targetFighterId) return;

    const row = serverTodayGame ?? null;
    if (row !== null && row.guessedFighterIds.length > 0) return;

    const syncKey = `${today}:${ids.join("|")}`;
    if (postLoginSyncSentRef.current === syncKey) return;
    if (syncCompletedGame.isPending) return;

    syncCompletedGame.mutate({
      won: gameWon,
      guesses: ids.length,
      fighterId: targetFighterId,
      playedDate: storedDate ?? today,
      guessedFighterIds: ids,
      hintsRevealed,
    });
  }, [
    session?.user,
    serverTodayPending,
    serverTodayGame,
    playedDateToday,
    gameWon,
    gameLost,
    storedDate,
    guessedFighters,
    targetFighterId,
    hintsRevealed,
    syncCompletedGame.isPending,
    syncCompletedGame.mutate,
    syncCompletedGame,
  ]);

  // Fetch today's daily fighter when there is no active game for today
  const needsDailyFetch = targetFighterId === null;

  const { data: dailyData } = api.boxing.getDailyFighter.useQuery(undefined, {
    enabled: needsDailyFetch,
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
    },
  );

  const targetFighter =
    targetFighterId !== null ? storedFighter : dailyData?.fighter;

  // Persist the daily fighter's ID and today's date the first time it resolves
  useEffect(() => {
    if (dailyData && targetFighterId === null) {
      setTargetFighterId(dailyData.fighter.id);
      setStoredDate(dailyData.dateString);
    }
  }, [dailyData, targetFighterId, setTargetFighterId, setStoredDate]);

  // Log target fighter for debugging
  useEffect(() => {
    if (targetFighter) {
      console.log(
        "[Ringdle] Target fighter:",
        targetFighter.name,
        targetFighter,
      );
    }
  }, [targetFighter]);

  const { data: fetchedFighter } = api.boxing.getFighterById.useQuery(
    pendingId !== null ? { id: pendingId } : skipToken,
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
    const nextGuesses = [
      ...guessedFighters,
      { fighter: fetchedFighter, result },
    ];
    setGuessedFighters(nextGuesses);

    const endedWin = won;
    const endedLoss = !won && nextGuesses.length >= MAX_GUESSES;

    if (endedWin) {
      setGameWon(true);
    } else if (endedLoss) {
      setGameLost(true);
    }

    if (endedWin || endedLoss) {
      const playedDate = storedDate ?? dailyData?.dateString ?? getTodayUTC();
      if (session?.user && !resultRecordedRef.current && targetFighter?.id) {
        resultRecordedRef.current = true;
        syncCompletedGame.mutate({
          won: endedWin,
          guesses: nextGuesses.length,
          fighterId: targetFighter.id,
          playedDate,
          guessedFighterIds: nextGuesses.map((g) => g.fighter.id),
          hintsRevealed,
        });
      }
    }

    setPendingId(null);
    setSearchKey((k) => k + 1);
  }, [
    fetchedFighter,
    targetFighter,
    guessedFighters,
    session?.user,
    storedDate,
    dailyData?.dateString,
    hintsRevealed,
    syncCompletedGame,
    setGuessedFighters,
    setGameWon,
    setGameLost,
  ]);

  // Handle select from search bar
  function handleSelect(id: string) {
    if (!guessedFighters.some((e) => e.fighter.id === id)) {
      setPendingId(id);
    } else {
      setSearchKey((k) => k + 1);
    }
  }

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />

      {/* Stats & Help */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStatsOpen(true)}
          aria-label="Your stats"
        >
          Stats
        </Button>
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
        <div className="flex flex-col items-center gap-3 rounded-lg border border-green-500 bg-green-50 px-6 py-4 dark:bg-green-950">
          <p className="text-center text-lg font-semibold text-green-700 dark:text-green-300">
            You got it! The boxer was{" "}
            <span className="font-bold">{targetFighter?.name}</span>.
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Next puzzle in{" "}
            <span className="font-mono font-bold">{countdown}</span>
          </p>
        </div>
      )}

      {/* Loss banner */}
      {gameLost && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-red-400 bg-red-50 px-6 py-4 dark:bg-red-950">
          <p className="text-center text-lg font-semibold text-red-700 dark:text-red-300">
            Out of guesses! The boxer was{" "}
            <span className="font-bold">{targetFighter?.name}</span>.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Next puzzle in{" "}
            <span className="font-mono font-bold">{countdown}</span>
          </p>
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

      {/* Hints panel */}
      {guessedFighters.length >= 4 && !gameWon && targetFighter && (
        <HintsPanel
          nickname={targetFighter.nickname}
          alias={targetFighter.alias ?? null}
          titles={targetFighter.titles}
          revealed={hintsRevealed}
          onReveal={() => setHintsRevealed(true)}
        />
      )}

      {/* Results table */}
      <BoxerGuessTable guessedFighters={guessedFighters} />
    </div>
  );
}
