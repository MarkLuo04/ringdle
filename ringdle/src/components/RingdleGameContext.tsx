"use client";

import { createContext, useContext } from "react";
import type { RingdleGameContextValue } from "~/hooks/useRingdleGame";

const RingdleGameContext = createContext<RingdleGameContextValue | null>(null);

export function RingdleGameProvider({
  value,
  children,
}: {
  value: RingdleGameContextValue;
  children: React.ReactNode;
}) {
  return (
    <RingdleGameContext.Provider value={value}>
      {children}
    </RingdleGameContext.Provider>
  );
}

export function useRingdleGameContext(): RingdleGameContextValue {
  const ctx = useContext(RingdleGameContext);
  if (!ctx) {
    throw new Error("useRingdleGameContext must be used within RingdleGame");
  }
  return ctx;
}
