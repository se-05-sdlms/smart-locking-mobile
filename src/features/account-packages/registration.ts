import * as Linking from "expo-linking";

import { accountPackageApi } from "@/features/account-packages/api";
import { saveSubscriptionCheckout } from "@/features/account-packages/storage";
import type { SubscriptionCheckout } from "@/features/account-packages/types";

export type RegistrationPackageResult = "activated" | "payment-opened" | "skipped" | "failed";

type Dependencies = {
  subscribe: (planId: string) => Promise<SubscriptionCheckout>;
  saveCheckout: (userId: string, payment: SubscriptionCheckout) => Promise<void>;
  openUrl: (url: string) => Promise<unknown>;
};

const defaults: Dependencies = {
  subscribe: accountPackageApi.subscribe,
  saveCheckout: saveSubscriptionCheckout,
  openUrl: (url) => Linking.openURL(url),
};

const isValidPayment = (payment: SubscriptionCheckout): boolean =>
  /^https?:\/\//i.test(payment.checkoutUrl) &&
  Number.isSafeInteger(payment.amount) &&
  payment.amount > 0 &&
  Number.isSafeInteger(payment.orderCode);

/**
 * Records the package chosen at registration on the Backend right after the account exists (SRS UC-01).
 * A free plan is activated immediately; a paid plan opens its payment page. Registration has already
 * succeeded by then, so this never throws: on any failure the Resident finishes the package in
 * Account > Package, where the locally saved preference is pre-selected.
 */
export async function subscribeAfterRegistration(
  userId: string,
  planId: string | null | undefined,
  dependencies: Dependencies = defaults
): Promise<RegistrationPackageResult> {
  if (!planId) return "skipped";
  try {
    const payment = await dependencies.subscribe(planId);
    if (payment.activated) return "activated";
    if (!isValidPayment(payment)) return "failed";
    // Persist before opening the provider so the package screen can resume without creating a second checkout.
    await dependencies.saveCheckout(userId, payment);
    await dependencies.openUrl(payment.checkoutUrl);
    return "payment-opened";
  } catch {
    return "failed";
  }
}
