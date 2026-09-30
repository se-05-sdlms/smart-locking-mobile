export type PickupUnlockResult = {
  parcelId: string;
  accessEventId: string;
  result: "Succeeded" | "Failed" | "Blocked";
  failureReason: string | null;
  requestedAt: string;
};
