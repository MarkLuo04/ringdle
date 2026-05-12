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

export function BoxerSearchBar({ onSelect, disabled = false, rightLabel }: BoxerSearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce input to prevent excessive calls
  const debouncedInput = useDebounce(inputValue, 150);

  // Fetch suggestions from API
  const { data: suggestions } = api.boxing.suggestFighters.useQuery(
    { query: debouncedInput },
    { enabled: debouncedInput.length >= 2 }
  );

  // Handle select from search bar 
  function handleSelect(id: string) {
    onSelect(id);
  }

  // Render search bar
  return (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel>Search for a boxer</FieldLabel>
        {rightLabel && <span className="text-sm text-muted-foreground">{rightLabel}</span>}
      </div>
      <div className="relative">
        <Input
          type="text"
          placeholder="Enter a boxer's name..."
          value={inputValue}
          disabled={disabled}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => { if (inputValue.length >= 2) setShowSuggestions(true); }}
          className="w-full"
        />

        {/* Live search suggestions */}
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 rounded-md border bg-popover shadow-md">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(s.id)}
                >
                  {s.name}
                  <span className="ml-2 text-muted-foreground text-xs">
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
