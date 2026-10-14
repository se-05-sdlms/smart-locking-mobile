import type {
  AccountPackage,
  ResidentSubscription,
  SubscriptionCheckout,
} from "@/features/account-packages/types";
import { apiRequest } from "@/lib/api-client";

export const accountPackageApi = {
  getPlans: () => apiRequest<AccountPackage[]>("/subscription-plans"),
  getCurrent: () =>
    apiRequest<ResidentSubscription | null | undefined>("/resident-subscriptions/current", {
      authenticated: true,
    }).then((subscription) => subscription ?? null),
  getHistory: () =>
    apiRequest<ResidentSubscription[]>("/resident-subscriptions/history", { authenticated: true }),
  subscribe: (planId: string) =>
    apiRequest<SubscriptionCheckout>("/resident-subscriptions/subscribe", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ planId }),
    }),
};
