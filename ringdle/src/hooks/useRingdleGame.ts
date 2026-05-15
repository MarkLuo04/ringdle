"use client";

import { useState, useEffect, useRef } from "react";
import { skipToken } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { compareFighters } from "~/lib/compareFighters";
import type { GuessEntry } from "~/components/BoxerGuessTable";
import { useGameStorage } from "~/hooks/useGameStorage";
import {
  MAX_GUESSES,
  archiveStoragePrefix,
  getTodayUTC,
} from "~/lib/ringdleGame";
import type { BoxingDataFighter } from "~/server/api/routers/types/boxing-data.types";

export type RingdleGameMode = "daily" | "archive";

// options for the useRingdleGame hook
export type UseRingdleGameOptions = {
  mode: RingdleGameMode;
  playedDate: string;
  /** Required for daily mode; archive games are ephemeral (in-memory only). */
  storagePrefix?: string;
};

// calculate the time until midnight UTC
function msUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return midnight.getTime() - now.getTime();
}

// format the countdown time
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

// the useRingdleGame hook
export function useRingdleGame({
  mode,
  playedDate,
  storagePrefix,
}: UseRingdleGameOptions) {
  const isDaily = mode === "daily";
  if (isDaily && !storagePrefix) {
    throw new Error("storagePrefix is required for daily mode");
  }
  const persist = isDaily;
  const storageKey = (suffix: string) => `${storagePrefix ?? "ringdle"}-${suffix}`;

  const { data: session } = useSession();
  const utils = api.useUtils();
  const playedDateToday = getTodayUTC();

  const { data: serverTodayGame, isPending: serverTodayPending } =
    api.stats.getTodayGame.useQuery(
      { playedDate: playedDateToday },
      {
        enabled: isDaily && !!session?.user,
        staleTime: 60_000,
        refetchOnWindowFocus: true,
      },
    );

  const [guessedFighters, setGuessedFighters] = useGameStorage<GuessEntry[]>(
    persist,
    storageKey("guesses"),
    [],
  );
  const [gameWon, setGameWon] = useGameStorage(persist, storageKey("won"), false);
  const [gameLost, setGameLost] = useGameStorage(persist, storageKey("lost"), false);
  const [targetFighterId, setTargetFighterId] = useGameStorage<string | null>(
    persist,
    storageKey("target-id"),
    null,
  );
  const [hintsRevealed, setHintsRevealed] = useGameStorage(
    persist,
    storageKey("hints-revealed"),
    false,
  );
  const [storedDate, setStoredDate] = useGameStorage<string | null>(
    persist,
    storageKey("date"),
    null,
  );

  // state for the pending fighter id, search key, and countdown
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);
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

  // Remove legacy persisted archive state (archive is ephemeral now).
  useEffect(() => {
    if (isDaily) return;
    const prefix = archiveStoragePrefix(playedDate);
    for (const suffix of [
      "guesses",
      "won",
      "lost",
      "target-id",
      "hints-revealed",
      "date",
    ] as const) {
      try {
        window.localStorage.removeItem(`${prefix}-${suffix}`);
      } catch {
        /* ignore */
      }
    }
  }, [isDaily, playedDate]);

  // reset the game state when the date changes
  useEffect(() => {
    if (!isDaily || !storagePrefix) return;

    const today = getTodayUTC();
    let rawDate: string | null = null;
    try {
      const item = window.localStorage.getItem(`${storagePrefix}-date`);
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
    isDaily,
    storagePrefix,
    setGuessedFighters,
    setGameWon,
    setGameLost,
    setTargetFighterId,
    setHintsRevealed,
    setStoredDate,
  ]);

  // update the countdown every second
  useEffect(() => {
    if (!isDaily || (!gameWon && !gameLost)) return;
    const interval = setInterval(() => {
      setCountdown(formatCountdown(msUntilMidnightUTC()));
    }, 1000);
    return () => clearInterval(interval);
  }, [isDaily, gameWon, gameLost]);

  useEffect(() => {
    if (!isDaily || !session?.user || serverTodayPending) return;

    const row = serverTodayGame;
    if (row?.playedDate !== playedDateToday) return;

    const finished = row.won === true || row.guesses >= MAX_GUESSES;
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
    isDaily,
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

  // sync the game state to the server when the game is won or lost
  useEffect(() => {
    if (!isDaily || !session?.user || serverTodayPending) return;

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
    isDaily,
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

  // check if the daily fighter needs to be fetched
  const needsDailyFetch = targetFighterId === null;

  // fetch the daily fighter
  const { data: dailyData } = api.boxing.getDailyFighter.useQuery(
    isDaily ? undefined : { playedDate },
    {
      enabled: needsDailyFetch,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  );

  // fetch the stored fighter
  const { data: storedFighter } = api.boxing.getFighterById.useQuery(
    targetFighterId !== null ? { id: targetFighterId } : skipToken,
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  );

  // get the target fighter
  const targetFighter: BoxingDataFighter | undefined =
    targetFighterId !== null ? storedFighter : dailyData?.fighter;

  useEffect(() => {
    if (dailyData && targetFighterId === null) {
      setTargetFighterId(dailyData.fighter.id);
      setStoredDate(dailyData.dateString);
    }
  }, [dailyData, targetFighterId, setTargetFighterId, setStoredDate]);

  const { data: fetchedFighter } = api.boxing.getFighterById.useQuery(
    pendingId !== null ? { id: pendingId } : skipToken,
  );

  useEffect(() => {
    if (!fetchedFighter || !targetFighter) return;

    if (guessedFighters.some((e) => e.fighter.id === fetchedFighter.id)) {
      setPendingId(null);
      setSearchKey((k) => k + 1);
      return;
    }

    const result = compareFighters(fetchedFighter, targetFighter);
    const won = Object.values(result).every((c) => c.status === "correct");

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

    // sync the game state to the server when the game is won or lost
    if (isDaily && (endedWin || endedLoss)) {
      const syncDate = storedDate ?? dailyData?.dateString ?? getTodayUTC();
      if (session?.user && !resultRecordedRef.current && targetFighter?.id) {
        resultRecordedRef.current = true;
        syncCompletedGame.mutate({
          won: endedWin,
          guesses: nextGuesses.length,
          fighterId: targetFighter.id,
          playedDate: syncDate,
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
    isDaily,
    session?.user,
    storedDate,
    dailyData?.dateString,
    hintsRevealed,
    syncCompletedGame,
    setGuessedFighters,
    setGameWon,
    setGameLost,
  ]);

  // handle the selection of a fighter
  function handleSelect(id: string) {
    if (!guessedFighters.some((e) => e.fighter.id === id)) {
      setPendingId(id);
    } else {
      setSearchKey((k) => k + 1);
    }
  }

  const gameOver = gameWon || gameLost;
  const canGuess = !gameOver;

  return {
    mode,
    isDaily,
    playedDate,
    guessedFighters,
    gameWon,
    gameLost,
    gameOver,
    canGuess,
    targetFighter,
    hintsRevealed,
    setHintsRevealed,
    searchKey,
    countdown,
    handleSelect,
  };
}

export type RingdleGameContextValue = ReturnType<typeof useRingdleGame>;
