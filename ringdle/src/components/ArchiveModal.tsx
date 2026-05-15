"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/retroui/Button";
import { Card } from "~/components/retroui/Card";
import { Text } from "~/components/retroui/Text";
import {
  RINGDLE_LAUNCH_DATE,
  getYesterdayUTC,
  isValidArchiveDate,
} from "~/lib/ringdleGame";

interface ArchiveModalProps {
  open: boolean;
  onClose: () => void;
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function ArchiveModal({ open, onClose }: ArchiveModalProps) {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(getYesterdayUTC());
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function openCalendar() {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      void input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  }

  function handlePlay() {
    // validate the date
    if (!isValidArchiveDate(date)) {
      setError("Choose a date from launch day through yesterday (UTC).");
      return;
    }
    onClose();
    router.push(`/archive/${date}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Archive modal card */}
      <Card
        className="mx-4 block w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card.Header className="flex-row items-center justify-between border-b-2 border-black">
          <Card.Title className="mb-0">Past Ringdles</Card.Title>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close archive picker"
          >
            ✕
          </Button>
        </Card.Header>

        {/* Archive modal content */}
        <Card.Content className="space-y-4">
          <Text as="p">
            Replay a past daily puzzle. Archive games do not count toward your
            stats and will not be saved.
          </Text>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Date (UTC)</span>
            <div className="flex gap-2">
              <input
                ref={dateInputRef}
                type="date"
                className="border-input bg-background flex-1 rounded-md border px-3 py-2 text-sm [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
                min={RINGDLE_LAUNCH_DATE}
                max={getYesterdayUTC()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={openCalendar}
                aria-label="Open calendar"
              >
                <CalendarIcon />
              </Button>
            </div>
          </label>
          {error && (
            <Text as="p" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          )}
          {/* Play button */}
          <Button className="w-full" onClick={handlePlay}>
            Play
          </Button>
        </Card.Content>
      </Card>
    </div>
  );
}
