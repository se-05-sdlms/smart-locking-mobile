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
