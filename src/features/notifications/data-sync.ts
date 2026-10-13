import { useSyncExternalStore } from "react";

let revision = 0;
const listeners = new Set<() => void>();

export function invalidateMobileData(): void {
  revision += 1;
  listeners.forEach((listener) => listener());
}

export function useMobileDataRevision(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => revision,
    () => revision
  );
}
