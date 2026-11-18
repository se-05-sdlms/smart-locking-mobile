import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { ENV } from "@/config/env";
import { notificationApi } from "@/features/notifications/api";
import { ApiError } from "@/lib/api-client";

const INSTALLATION_KEY = "boxora.push.installation";
let installationOperation: Promise<void> = Promise.resolve();

function queueInstallation(operation: () => Promise<void>): Promise<void> {
  const next = installationOperation.catch(() => undefined).then(operation);
  installationOperation = next;
  return next;
}

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

export function registerPushInstallation(): Promise<void> {
  return queueInstallation(registerInstallation);
}

async function registerInstallation(): Promise<void> {
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
  // Persist before the request: a lost response can still have registered the device.
  await SecureStore.setItemAsync(INSTALLATION_KEY, installationId, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await notificationApi.registerDevice({ installationId, expoPushToken, platform: Platform.OS });
}

export function deactivatePushInstallation(): Promise<void> {
  return queueInstallation(deactivateInstallation);
}

async function deactivateInstallation(): Promise<void> {
  const installationId = await SecureStore.getItemAsync(INSTALLATION_KEY);
  if (!installationId) return;
  try {
    await notificationApi.deactivateDevice(installationId);
  } catch (error) {
    // Missing registration already satisfies deactivation; network/server failures must retry.
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
  await SecureStore.deleteItemAsync(INSTALLATION_KEY);
}
