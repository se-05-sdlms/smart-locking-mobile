import * as Notifications from "expo-notifications";
import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useAuth } from "@/features/auth/auth-context";
import { invalidateMobileData } from "@/features/notifications/data-sync";
import { openNotificationTarget, targetFromPushData } from "@/features/notifications/navigation";
import { registerPushInstallation } from "@/features/notifications/push";

export function NotificationBridge(): JSX.Element | null {
  const { user } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user) return;
    void registerPushInstallation().catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const received = Notifications.addNotificationReceivedListener(invalidateMobileData);
    const dropped = Notifications.addNotificationsDroppedListener(invalidateMobileData);
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (appState.current !== "active" && nextState === "active") invalidateMobileData();
        appState.current = nextState;
      }
    );
    return () => {
      received.remove();
      dropped.remove();
      appStateSubscription.remove();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const open = (response: Notifications.NotificationResponse): void => {
      openNotificationTarget(targetFromPushData(response.notification.request.content.data ?? {}));
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      open(response);
      void Notifications.clearLastNotificationResponseAsync();
    });
    return () => subscription.remove();
  }, [user]);

  return null;
}
