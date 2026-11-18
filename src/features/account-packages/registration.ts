import { router } from "expo-router";

import { accountPackageApi } from "@/features/account-packages/api";
import { saveSubscriptionCheckout } from "@/features/account-packages/storage";
import type { SubscriptionCheckout } from "@/features/account-packages/types";

export type RegistrationPackageResult = "activated" | "payment-opened" | "skipped" | "failed";

type Dependencies = {
  subscribe: (planId: string) => Promise<SubscriptionCheckout>;
  saveCheckout: (userId: string, payment: SubscriptionCheckout) => Promise<void>;
  openPayment: (subscriptionId: string) => void;
};

const defaults: Dependencies = {
  subscribe: accountPackageApi.subscribe,
  saveCheckout: saveSubscriptionCheckout,
  openPayment: (id) => router.push({ pathname: "/subscription-payment/[id]", params: { id } }),
};

const isValidPayment = (payment: SubscriptionCheckout): boolean =>
  Boolean(payment.qrCode?.trim()) &&
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
    // Persist before navigating so the QR screen can reopen the same checkout.
    await dependencies.saveCheckout(userId, payment);
    dependencies.openPayment(payment.subscriptionId);
    return "payment-opened";
  } catch {
    return "failed";
  }
}
