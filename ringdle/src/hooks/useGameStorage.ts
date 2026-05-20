import { useState, useEffect, useCallback } from "react";

// In-memory state, or persisted to localStorage when `persist` is true 
export function useGameStorage<T>(
  persist: boolean,
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [value, setValueState] = useState<T>(initialValue);

  useEffect(() => {
    if (!persist) return;
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setValueState(JSON.parse(item) as T);
      }
    } catch {
      // ignore read errors
    }
  }, [persist, key]);

  const setValue = useCallback(
    (next: T) => {
      setValueState(next);
      if (!persist) return;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore write errors
      }
    },
    [persist, key],
  );

  return [value, setValue];
}
