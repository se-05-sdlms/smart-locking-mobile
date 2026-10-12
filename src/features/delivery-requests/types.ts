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
  id?: string;
  registeredLockerId?: string | null;
  fullName?: string;
  phoneNumber?: string | null;
  email?: string | null;
  deliveryApprovalMode: DeliveryApprovalMode;
};
