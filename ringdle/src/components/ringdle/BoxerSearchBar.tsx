"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/useDebounce";
import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "@/components/retroui/Input";

interface BoxerSearchBarProps {
  onSelect: (id: string) => void;
  disabled?: boolean;
  rightLabel?: React.ReactNode;
}

export function BoxerSearchBar({
  onSelect,
  disabled = false,
  rightLabel,
}: BoxerSearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selecting, setSelecting] = useState(false);

  // Debounce input to prevent excessive calls
  const debouncedInput = useDebounce(inputValue, 150);

  // Fetch suggestions from API
  const { data: suggestions } = api.boxing.suggestFighters.useQuery(
    { query: debouncedInput },
    { enabled: debouncedInput.length >= 2 },
  );

  // Handle select from search bar
  function selectFighter(id: string) {
    if (selecting || disabled) return;
    setSelecting(true);
    setShowSuggestions(false);
    setInputValue("");
    onSelect(id);
  }

  // Render search bar
  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel className="text-base">Search for a boxer</FieldLabel>
        {rightLabel && (
          <span className="text-muted-foreground text-base">{rightLabel}</span>
        )}
      </div>
      <div className="relative">
        <Input
          type="text"
          placeholder="Enter a boxer's name..."
          value={inputValue}
          disabled={disabled || selecting}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => {
            if (inputValue.length >= 2) setShowSuggestions(true);
          }}
          className="w-full text-base"
        />

        {/* Live search suggestions */}
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <ul className="bg-popover absolute z-10 mt-1 w-full rounded-md border shadow-md">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="hover:bg-muted w-full px-4 py-3 text-left text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={selecting}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    selectFighter(s.id);
                  }}
                  onClick={() => selectFighter(s.id)}
                >
                  {s.name}
                  <span className="text-muted-foreground ml-2 text-sm font-normal">
                    {s.divisionName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}
