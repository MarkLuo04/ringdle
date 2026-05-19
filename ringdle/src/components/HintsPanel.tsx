"use client";

import { Button } from "~/components/retroui/Button";
import { Card } from "~/components/retroui/Card";
import { Text } from "~/components/retroui/Text";

interface HintsPanelProps {
  nickname: string | null;
  alias: string | null;
  titles: { id: string; name: string }[];
  revealed: boolean;
  onReveal: () => void;
}

export function HintsPanel({
  nickname,
  alias,
  titles,
  revealed,
  onReveal,
}: HintsPanelProps) {
  const displayNickname = nickname ?? alias;

  // If the hints are not revealed, show the reveal button
  if (!revealed) {
    return (
      <div className="border-muted-foreground/40 bg-muted/30 flex items-center justify-between rounded-md border border-dashed px-4 py-2">
        <Text as="p" className="text-muted-foreground text-base">
          Would you like a hint?
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReveal}
          className="text-base"
        >
          Reveal
        </Button>
      </div>
    );
  }

  // If the hints are revealed, show the nickname and titles
  return (
    <Card className="block w-full overflow-hidden">
      <Card.Content className="space-y-4">
        {/* Nickname row */}
        <div>
          <Text as="h5" className="mb-1 font-semibold">
            Nickname
          </Text>
          <Text as="p">
            {displayNickname ?? (
              <span className="text-muted-foreground italic">None known</span>
            )}
          </Text>
        </div>

        {/* Titles row */}
        <div>
          <Text as="h5" className="mb-1 font-semibold">
            Current Titles
          </Text>
          {titles.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 font-sans text-base">
              {titles.map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
          ) : (
            // If the titles are not known, show a message
            <Text as="p">
              <span className="text-muted-foreground italic">
                No current titles
              </span>
            </Text>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
