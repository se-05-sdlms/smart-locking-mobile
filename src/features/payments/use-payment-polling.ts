import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { AppState } from "react-native";

export function usePaymentPolling(enabled: boolean, refresh: () => Promise<void>) {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let running = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let focused = true;

      const check = async () => {
        clearTimeout(timer);
        if (!focused || running || AppState.currentState === "background") return;
        running = true;
        try {
          await refresh();
        } finally {
          running = false;
          if (focused) timer = setTimeout(() => void check(), 4000);
        }
      };

      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void check();
        else clearTimeout(timer);
      });
      timer = setTimeout(() => void check(), 4000);
      return () => {
        focused = false;
        clearTimeout(timer);
        listener.remove();
      };
    }, [enabled, refresh])
  );
}
