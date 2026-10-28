"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { readListState, writeListState, type ListStateSpec } from "@/lib/leadReturn";

/**
 * List filters survive leaving the page (lead detail, refresh in the same tab).
 * The first paint uses `initial` so server and client markup match, then the
 * saved view is applied before the list query is enabled (`ready`).
 */
export function usePersistedListState<T extends object>(
  storageKey: string,
  initial: T,
  spec: ListStateSpec,
  fixed?: Partial<T>,
): { state: T; setState: Dispatch<SetStateAction<T>>; ready: boolean } {
  const initialRef = useRef(initial);
  const specRef = useRef(spec);
  const fixedRef = useRef(fixed);
  initialRef.current = initial;
  specRef.current = spec;
  fixedRef.current = fixed;

  const [state, setRaw] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readListState(storageKey, specRef.current);
    const pinned = fixedRef.current ?? {};
    if (saved) {
      setRaw({ ...initialRef.current, ...(saved as Partial<T>), ...pinned });
    } else if (Object.keys(pinned).length > 0) {
      setRaw((current) => ({ ...current, ...pinned }));
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    writeListState(storageKey, state, specRef.current);
  }, [storageKey, state, ready]);

  const setState = useCallback((action: SetStateAction<T>) => {
    setRaw((current) => {
      const next = typeof action === "function" ? (action as (prev: T) => T)(current) : action;
      return fixedRef.current ? { ...next, ...fixedRef.current } : next;
    });
  }, []);

  return { state, setState, ready };
}
