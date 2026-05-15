"use client";

import Link from "next/link";
import { useState } from "react";
import { ArchiveModal } from "~/components/ArchiveModal";
import { HelpModal } from "~/components/HelpModal";
import { RingdleEndBanner } from "~/components/RingdleEndBanner";
import { RingdleGameProvider } from "~/components/RingdleGameContext";
import { StatsModal } from "~/components/StatsModal";
import { Button } from "~/components/retroui/Button";
import {
  useRingdleGame,
  type UseRingdleGameOptions,
} from "~/hooks/useRingdleGame";
import { formatArchiveLabel } from "~/lib/ringdleGame";

export type RingdleGameProps = UseRingdleGameOptions & {
  children: React.ReactNode;
};

export function RingdleGame({ children, ...options }: RingdleGameProps) {
  const game = useRingdleGame(options);
  const [helpOpen, setHelpOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const archiveLabel = formatArchiveLabel(game.playedDate);

  return (
    <RingdleGameProvider value={game}>
      {/* Main container for the game */}
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
        <ArchiveModal
          open={archiveOpen}
          onClose={() => setArchiveOpen(false)}
        />

        {/* Buttons for the game */}
        <div className="flex justify-end gap-2">
          {game.isDaily ? (
            <>
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
                onClick={() => setArchiveOpen(true)}
                aria-label="Play past Ringdles"
              >
                Archive
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArchiveOpen(true)}
              aria-label="Play another past Ringdle"
            >
              Archive
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHelpOpen(true)}
            aria-label="How to play"
          >
            ? Help
          </Button>
        </div>

        {/* Archive label for the archive page */}
        {!game.isDaily && (
          <p className="text-muted-foreground text-center text-sm">
            Archive · {archiveLabel}
            <span className="mx-2">·</span>
            <Link href="/" className="hover:text-foreground underline">
              Back to today&apos;s Ringdle
            </Link>
          </p>
        )}

        {/* End banner for the game */}
        <RingdleEndBanner
          gameWon={game.gameWon}
          gameLost={game.gameLost}
          isDaily={game.isDaily}
          targetFighter={game.targetFighter}
          countdown={game.countdown}
          onOpenArchive={() => setArchiveOpen(true)}
        />

        {children}
      </div>
    </RingdleGameProvider>
  );
}
