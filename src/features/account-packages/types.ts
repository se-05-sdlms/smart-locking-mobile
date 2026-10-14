export type AccountPackage = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  maxActiveParcels: number;
  isActive: boolean;
};

export type ResidentSubscription = {
  id: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  price: number;
  externalOrderCode: string | null;
  paidAt: string | null;
};

export type SubscriptionCheckout = {
  subscriptionId: string;
  checkoutUrl: string;
  orderCode: number;
  amount: number;
};
