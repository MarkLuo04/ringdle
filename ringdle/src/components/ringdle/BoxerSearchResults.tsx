"use client";

import { BoxerSearchBar } from "~/components/ringdle/BoxerSearchBar";
import { BoxerGuessTable } from "~/components/ringdle/BoxerGuessTable";
import { HintsPanel } from "~/components/ringdle/HintsPanel";
import { RingdleGame } from "~/components/ringdle/RingdleGame";
import { useRingdleGameContext } from "~/components/ringdle/RingdleGameContext";
import { MAX_GUESSES, getTodayUTC } from "~/lib/ringdleGame";

// Search bar, hints, and guess table
export function BoxerSearchPlayArea() {
  const {
    guessedFighters,
    gameWon,
    canGuess,
    targetFighter,
    hintsRevealed,
    setHintsRevealed,
    searchKey,
    handleSelect,
  } = useRingdleGameContext();

  return (
    <>
      {canGuess && (
        <BoxerSearchBar
          key={searchKey}
          onSelect={handleSelect}
          rightLabel={`${guessedFighters.length} / ${MAX_GUESSES} guesses used`}
        />
      )}

      {guessedFighters.length >= 4 && !gameWon && targetFighter && (
        <HintsPanel
          nickname={targetFighter.nickname}
          alias={targetFighter.alias ?? null}
          titles={targetFighter.titles}
          revealed={hintsRevealed}
          onReveal={() => setHintsRevealed(true)}
        />
      )}

      <BoxerGuessTable guessedFighters={guessedFighters} />
    </>
  );
}

// Daily game on the home page
export function BoxerSearchResults() {
  const today = getTodayUTC();
  return (
    <RingdleGame mode="daily" playedDate={today} storagePrefix="ringdle">
      <BoxerSearchPlayArea />
    </RingdleGame>
  );
}
