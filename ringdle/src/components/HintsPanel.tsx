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

export function HintsPanel({ nickname, alias, titles, revealed, onReveal }: HintsPanelProps) {
  const displayNickname = nickname ?? alias;

  if (!revealed) {
    return (
      <div className="flex items-center justify-between rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-2">
        <Text as="p" className="text-sm text-muted-foreground">
          Would you like a hint?
        </Text>
        <Button variant="ghost" size="sm" onClick={onReveal} className="text-sm">
          Reveal
        </Button>
      </div>
    );
  }

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
            <Text as="p">
              <span className="text-muted-foreground italic">No current titles</span>
            </Text>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
