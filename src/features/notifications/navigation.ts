import { router } from "expo-router";

import type { NotificationTarget } from "@/features/notifications/types";

export function openNotificationTarget(target: Partial<NotificationTarget>): void {
  if (target.parcelId) {
    router.push(`/parcels/${target.parcelId}`);
  } else if (target.deliveryRequestId) {
    router.push({ pathname: "/requests", params: { id: target.deliveryRequestId } });
  } else if (target.incidentId) {
    router.push({ pathname: "/incidents/[id]", params: { id: target.incidentId } });
  } else if (target.paymentTransactionId) {
    router.push({ pathname: "/payments/[id]", params: { id: target.paymentTransactionId } });
  }
}

export function targetFromPushData(data: Record<string, unknown>): Partial<NotificationTarget> {
  const value = (key: keyof NotificationTarget): string | null => {
    const raw = data[key];
    return typeof raw === "string" && raw ? raw : null;
  };
  return {
    parcelId: value("parcelId"),
    deliveryRequestId: value("deliveryRequestId"),
    incidentId: value("incidentId"),
    paymentTransactionId: value("paymentTransactionId"),
  };
}
