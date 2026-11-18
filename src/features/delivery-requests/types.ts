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

export type ResidentDeliveryRequest = Omit<PendingDeliveryRequest, "approvalExpiresAt"> & {
  status:
    | "Started"
    | "PendingApproval"
    | "Approved"
    | "Allocated"
    | "Deposited"
    | "Rejected"
    | "Expired"
    | "Cancelled"
    | "Failed";
  approvalExpiresAt: string | null;
  decisionAt: string | null;
};
