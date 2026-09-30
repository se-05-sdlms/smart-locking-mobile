export type PendingDeliveryRequest = {
  requestId: string;
  lockerCode: string;
  lockerAddress: string;
  parcelImageUrl: string | null;
  recipientPhone: string | null;
  createdAt: string;
  approvalExpiresAt: string;
};

export type DeliveryApprovalMode = 0 | 1;

export type ResidentApprovalProfile = {
  registeredLockerId: string | null;
  deliveryApprovalMode: DeliveryApprovalMode;
};
