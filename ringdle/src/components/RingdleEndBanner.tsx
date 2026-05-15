"use client";

import Link from "next/link";
import type { RingdleGameContextValue } from "~/hooks/useRingdleGame";

type RingdleEndBannerProps = Pick<
  RingdleGameContextValue,
  "gameWon" | "gameLost" | "isDaily" | "targetFighter" | "countdown"
> & {
  onOpenArchive: () => void;
};

export function RingdleEndBanner({
  gameWon,
  gameLost,
  isDaily,
  targetFighter,
  countdown,
  onOpenArchive,
}: RingdleEndBannerProps) {
  if (!gameWon && !gameLost) return null;

  // get the boxer name
  const boxerName = targetFighter?.name;

  if (gameWon) {
    // return the win banner
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-green-500 bg-green-50 px-6 py-4 dark:bg-green-950">
        <p className="text-center text-lg font-semibold text-green-700 dark:text-green-300">
          You got it! The boxer was{" "}
          <span className="font-bold">{boxerName}</span>.
        </p>
        {isDaily ? (
          <p className="text-sm text-green-600 dark:text-green-400">
            Next puzzle in{" "}
            <span className="font-mono font-bold">{countdown}</span>
          </p>
        ) : (
          <ArchiveLinks onOpenArchive={onOpenArchive} variant="win" />
        )}
      </div>
    );
  }

  // return the loss banner
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-red-400 bg-red-50 px-6 py-4 dark:bg-red-950">
      <p className="text-center text-lg font-semibold text-red-700 dark:text-red-300">
        Out of guesses! The boxer was{" "}
        <span className="font-bold">{boxerName}</span>.
      </p>
      {isDaily ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          Next puzzle in{" "}
          <span className="font-mono font-bold">{countdown}</span>
        </p>
      ) : (
        <ArchiveLinks onOpenArchive={onOpenArchive} variant="loss" />
      )}
    </div>
  );
}

// Archive links for the end banner
function ArchiveLinks({
  onOpenArchive,
  variant,
}: {
  onOpenArchive: () => void;
  variant: "win" | "loss";
}) {
  const linkClass =
    variant === "win"
      ? "underline hover:text-green-800 dark:hover:text-green-200"
      : "underline hover:text-red-800 dark:hover:text-red-200";
  const textClass =
    variant === "win"
      ? "text-sm text-green-600 dark:text-green-400"
      : "text-sm text-red-600 dark:text-red-400";

  return (
    <div className={`flex flex-wrap justify-center gap-3 ${textClass}`}>
      <Link href="/" className={linkClass}>
        Today&apos;s Ringdle
      </Link>
      <button type="button" className={linkClass} onClick={onOpenArchive}>
        Play another date
      </button>
    </div>
  );
}
