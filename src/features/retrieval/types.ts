export type PersonalQr = {
  qrToken: string;
  issuedAt: string;
};

export type PickupUnlockResult = {
  parcelId: string;
  accessEventId: string;
  result: "Succeeded" | "Failed" | "Blocked";
  failureReason: string | null;
  requestedAt: string;
};
