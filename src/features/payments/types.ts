export type PaymentTransaction = {
  id: string;
  overdueChargeId: string;
  amount: number;
  currency: string;
  status: number | string;
  checkoutUrl: string | null;
  externalTransactionId: string | null;
  requestedAt: string;
  completedAt: string | null;
};

export type CreatedPayment = PaymentTransaction & { checkoutUrl: string };
