import * as SecureStore from "expo-secure-store";

// This is a device-local preference, never proof of an active subscription.
const preferenceKey = (userId: string) => `boxora.account-package.${userId}`;

export const readPreferredPackage = (userId: string): Promise<string | null> =>
  SecureStore.getItemAsync(preferenceKey(userId));

export async function savePreferredPackage(userId: string, planId: string | null): Promise<void> {
  if (planId) await SecureStore.setItemAsync(preferenceKey(userId), planId);
  else await SecureStore.deleteItemAsync(preferenceKey(userId));
}
