import * as Notifications from "expo-notifications";
import type { JSX } from "react";
import { useEffect } from "react";

import { useAuth } from "@/features/auth/auth-context";
import { openNotificationTarget, targetFromPushData } from "@/features/notifications/navigation";
import { registerPushInstallation } from "@/features/notifications/push";

export function NotificationBridge(): JSX.Element | null {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void registerPushInstallation().catch(() => undefined);
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
