import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { ENV } from "@/config/env";
import { notificationApi } from "@/features/notifications/api";

const INSTALLATION_KEY = "boxora.push.installation";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getInstallationId(): Promise<string | null> {
  if (Platform.OS === "android") return Application.getAndroidId();
  if (Platform.OS === "ios") return Application.getIosIdForVendorAsync();
  return null;
}

export async function registerPushInstallation(): Promise<void> {
  if (!Device.isDevice || (Platform.OS !== "android" && Platform.OS !== "ios")) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Thông báo Boxora",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === "granted" ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return;

  const projectId = ENV.EAS_PROJECT_ID ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  const installationId = await getInstallationId();
  if (!installationId) return;

  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await notificationApi.registerDevice({
    installationId,
    expoPushToken,
    platform: Platform.OS,
  });
  await SecureStore.setItemAsync(INSTALLATION_KEY, installationId, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function deactivatePushInstallation(): Promise<void> {
  const installationId = await SecureStore.getItemAsync(INSTALLATION_KEY);
  if (!installationId) return;
  await notificationApi.deactivateDevice(installationId);
  await SecureStore.deleteItemAsync(INSTALLATION_KEY);
}
