import * as SecureStore from "expo-secure-store";

import type { SubscriptionCheckout } from "@/features/account-packages/types";

// This is a device-local preference, never proof of an active subscription.
const preferenceKey = (userId: string) => `boxora.account-package.${userId}`;

export const readPreferredPackage = (userId: string): Promise<string | null> =>
  SecureStore.getItemAsync(preferenceKey(userId));

export async function savePreferredPackage(userId: string, planId: string | null): Promise<void> {
  if (planId) await SecureStore.setItemAsync(preferenceKey(userId), planId);
  else await SecureStore.deleteItemAsync(preferenceKey(userId));
}

const checkoutKey = (userId: string, subscriptionId: string) =>
  `boxora.subscription-checkout.${userId}.${subscriptionId}`;

export async function readSubscriptionCheckout(
  userId: string,
  subscriptionId: string
): Promise<SubscriptionCheckout | null> {
  const value = await SecureStore.getItemAsync(checkoutKey(userId, subscriptionId));
  if (!value) return null;
  try {
    const payment = JSON.parse(value) as Partial<SubscriptionCheckout> | null;
    if (!payment || payment.subscriptionId !== subscriptionId ||
      typeof payment.checkoutUrl !== "string" || !/^https?:\/\//i.test(payment.checkoutUrl) ||
      typeof payment.amount !== "number" || !Number.isSafeInteger(payment.amount) || payment.amount <= 0 ||
      typeof payment.orderCode !== "number" || !Number.isSafeInteger(payment.orderCode)) return null;
    return payment as SubscriptionCheckout;
  } catch {
    return null;
  }
}

export async function saveSubscriptionCheckout(
  userId: string,
  payment: SubscriptionCheckout
): Promise<void> {
  await SecureStore.setItemAsync(checkoutKey(userId, payment.subscriptionId), JSON.stringify(payment), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
