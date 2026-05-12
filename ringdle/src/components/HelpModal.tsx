"use client";

import { Button } from "~/components/retroui/Button";
import { Card } from "~/components/retroui/Card";
import { Text } from "~/components/retroui/Text";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="mx-4 block w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Card.Header className="flex-row items-center justify-between border-b-2 border-black">
          <Card.Title className="mb-0">How to Play</Card.Title>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close help"
          >
            ✕
          </Button>
        </Card.Header>

        {/* Scrollable content */}
        <Card.Content className="max-h-[70vh] space-y-5 overflow-y-auto">
          {/* Objective */}
          <section>
            <Text as="h5" className="mb-1 font-semibold">
              Objective
            </Text>
            <Text as="p">
              Guess the 21st century boxer within <strong>8 tries!</strong>
            </Text>
          </section>

          {/* Rules */}
          <section>
            <Text as="h5" className="mb-1 font-semibold">
              Rules
            </Text>
            <ul className="list-inside list-disc space-y-1 font-sans text-base">
              <li>
                Type a boxer&apos;s name in the search bar and select them from
                the dropdown.
              </li>
              <li>
                Each guess reveals feedback for every attribute.
              </li>
              <li>Hints are available after 4 guesses.</li>
              <li>
                The game ends when you guess the mystery boxer correctly or when you run out of guesses!
              </li>
            </ul>
          </section>

          {/* Colour legend */}
          <section>
            <Text as="h5" className="mb-2 font-semibold">
              Colours
            </Text>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="inline-block w-20 shrink-0 rounded border-2 border-black bg-green-600 px-2 py-1 text-center text-sm font-semibold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Correct
                </span>
                <Text as="p">Exact match</Text>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block w-20 shrink-0 rounded border-2 border-black bg-amber-500 px-2 py-1 text-center text-sm font-semibold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Close
                </span>
                <Text as="p">
                  Close match
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block w-20 shrink-0 rounded border-2 border-black px-2 py-1 text-center text-sm font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Wrong
                </span>
                <Text as="p">No match</Text>
              </div>
            </div>
          </section>

          {/* Close thresholds */}
          <section>
            <Text as="h5" className="mb-1 font-semibold">
              Close Ranges
            </Text>
            <ul className="list-inside list-disc space-y-1 font-sans text-base">
              <li>
                <strong>Division</strong> — within 15 lbs (roughly 2-3 weight classes apart).
              </li>
              <li>
                <strong>Height</strong> — within 2 inches.
              </li>
              <li>
                <strong>Age</strong> — within 3 years.
              </li>
              <li>
                <strong>Debut Year</strong> — within 3 years.
              </li>
              <li>
                <strong>Wins</strong> — within 5.
              </li>
              <li>
                <strong>Losses</strong> — within 3.
              </li>
            </ul>
          </section>
        </Card.Content>

        {/* Footer */}
        <div className="flex justify-end border-t-2 border-black px-4 py-3">
          <Button variant="default" size="sm" onClick={onClose}>
            Got it!
          </Button>
        </div>
      </Card>
    </div>
  );
}
