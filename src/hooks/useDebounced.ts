import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number,
): [T, () => void] {
  const callbackRef = useRef(callback);
  const timerRef = useRef<number | null>(null);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingArgsRef.current !== null) {
      callbackRef.current(...pendingArgsRef.current);
      pendingArgsRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      flush();
    },
    [flush],
  );

  const debounced = useCallback(
    ((...args: Parameters<T>) => {
      pendingArgsRef.current = args;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        pendingArgsRef.current = null;
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay],
  );

  return [debounced, flush];
}

export function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: unknown[],
  delay: number,
): void {
  const effectRef = useRef(effect);

  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      effectRef.current();
    }, delay);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
