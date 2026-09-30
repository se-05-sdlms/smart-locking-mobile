export type ResidentNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  deliveryRequestId: string | null;
  parcelId: string | null;
  incidentId: string | null;
  paymentTransactionId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationTarget = Pick<
  ResidentNotification,
  "deliveryRequestId" | "parcelId" | "incidentId" | "paymentTransactionId"
>;
