export type ReturnStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ReturnRequestItem = {
  id: string; pickupCode: string; imageUrl: string; note: string | null; status: ReturnStatus;
  lockerCode: string; lockerAddress: string; compartmentCode: string | null; createdAt: string;
  reservationExpiresAt: string | null; residentDepositedAt: string | null; shipperPickedUpAt: string | null;
};
export type ReturnUnlock = { returnRequestId: string; compartmentCode: string; accessEventId: string; reservationExpiresAt: string };
export type ReturnDeposit = { returnRequestId: string; pickupCode: string; compartmentCode: string; status: ReturnStatus };
