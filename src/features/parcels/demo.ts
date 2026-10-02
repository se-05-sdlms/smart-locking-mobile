import type { ParcelDetail } from "./types";

// Explicit UI fixtures; these IDs must never be sent to the unlock endpoint.
const now = Date.now();
const day = 86400000;
const base: ParcelDetail = {
  id: "demo-active",
  parcelCode: "PRC001234",
  status: "Stored",
  lockerId: "demo-locker",
  lockerCode: "LK-01",
  lockerAddress: "123 Trần Phú, Đà Nẵng",
  compartmentId: "demo-compartment",
  compartmentCode: "12",
  storedAt: new Date(now - day).toISOString(),
  pickupDueAt: new Date(now + 3 * day).toISOString(),
  maxStorageUntil: new Date(now + 7 * day).toISOString(),
  retrievedAt: null,
  removedAt: null,
  overdueAmount: null,
  currency: null,
  overdueChargeStatus: null,
  lockerRecoveryAddress: "123 Trần Phú, Đà Nẵng",
  parcelImageUrl: null,
  shipperName: "Nguyễn Văn An",
  shipperPhone: "0900000000",
};
export const demoActive = [base];
export const demoHistory: ParcelDetail[] = [
  {
    ...base,
    id: "demo-received",
    parcelCode: "PRC001200",
    status: "Retrieved",
    retrievedAt: new Date(now - 2 * day).toISOString(),
  },
  {
    ...base,
    id: "demo-removed",
    parcelCode: "PRC001180",
    status: "Removed",
    removedAt: new Date(now - 5 * day).toISOString(),
  },
];
export const demoParcels = [...demoActive, ...demoHistory];
