"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/retroui/Button";
import { Card } from "~/components/retroui/Card";
import { Text } from "~/components/retroui/Text";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:bg-neutral-900">
      <Text
        as="p"
        className="text-sm font-semibold text-neutral-600 dark:text-neutral-400"
      >
        {label}
      </Text>
      <Text as="p" className="mt-1 text-2xl font-bold tabular-nums">
        {value}
      </Text>
    </div>
  );
}

export function StatsModal({ open, onClose }: StatsModalProps) {
  const { status } = useSession();

  const { data: stats, isLoading } = api.stats.getMyStats.useQuery(undefined, {
    enabled: open && status === "authenticated",
  });

  if (!open) return null;

  const loggedIn = status === "authenticated";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="mx-4 block w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card.Header className="flex-row items-center justify-between border-b-2 border-black">
          <Card.Title className="mb-0">Your stats</Card.Title>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close stats"
          >
            ✕
          </Button>
        </Card.Header>

        <Card.Content className="max-h-[70vh] space-y-4 overflow-y-auto">
          {!loggedIn && (
            <Text as="p">
              Logged-in players track Ringdle stats automatically.{" "}
              <Link
                href="/login"
                className="font-semibold underline underline-offset-2"
              >
                Log in
              </Link>{" "}
              or{" "}
              <Link
                href="/register"
                className="font-semibold underline underline-offset-2"
              >
                create an account
              </Link>{" "}
              to save yours.
            </Text>
          )}

          {loggedIn && isLoading && <Text as="p">Loading your stats…</Text>}

          {loggedIn && stats && (
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Games played"
                value={String(stats.gamesPlayed)}
              />
              <StatTile
                label="Win rate"
                value={`${stats.winPercentage.toFixed(1)}%`}
              />
              <StatTile
                label="Current streak"
                value={String(stats.currentStreak)}
              />
              <StatTile
                label="Longest streak"
                value={String(stats.longestStreak)}
              />
              <StatTile
                label="Avg. guesses (wins)"
                value={
                  stats.avgGuessesOnWins === null
                    ? "—"
                    : stats.avgGuessesOnWins.toFixed(2)
                }
              />
            </div>
          )}
        </Card.Content>

        <div className="flex justify-end border-t-2 border-black px-4 py-3">
          <Button variant="default" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
