export type ParcelStatus = "Stored" | "Overdue" | "Retrieved" | "Removed";

export type ParcelListItem = {
  id: string;
  parcelCode: string;
  status: ParcelStatus;
  lockerId: string;
  lockerCode: string;
  lockerAddress: string;
  compartmentId: string;
  compartmentCode: string;
  storedAt: string;
  pickupDueAt: string;
  maxStorageUntil: string;
  retrievedAt: string | null;
  removedAt: string | null;
  overdueAmount: number | null;
  currency: string | null;
  overdueChargeStatus: "Outstanding" | "Paid" | null;
};

export type ParcelDetail = ParcelListItem & {
  lockerRecoveryAddress: string;
  parcelImageUrl: string | null;
  shipperName: string | null;
  shipperPhone: string | null;
};

export type ParcelStatusHistory = {
  id: string;
  fromStatus: ParcelStatus | null;
  toStatus: ParcelStatus;
  reason: string | null;
  changedAt: string;
};
