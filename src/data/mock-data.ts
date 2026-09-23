export type Parcel = {
  id: string;
  locker: string;
  compartment: string;
  address: string;
  status: "today" | "soon" | "overdue" | "received";
  date?: string;
};

export const parcels: Parcel[] = [
  {
    id: "PRC250328-0012",
    locker: "LK-01",
    compartment: "A03",
    address: "Số 123 Nguyễn Văn Linh, Q.7",
    status: "today",
  },
  {
    id: "SPX250327-8845",
    locker: "LK-02",
    compartment: "B12",
    address: "Số 123 Nguyễn Văn Linh, Q.7",
    status: "overdue",
  },
  {
    id: "TIK250326-7710",
    locker: "LK-01",
    compartment: "C05",
    address: "Số 123 Nguyễn Văn Linh, Q.7",
    status: "soon",
  },
];

export const historyParcels: Parcel[] = [
  { ...parcels[0], status: "received", date: "28/03/2025 16:15" },
  { ...parcels[2], status: "received", date: "26/03/2025 14:20" },
  {
    id: "SPX250320-4412",
    locker: "LK-02",
    compartment: "B07",
    address: "Số 123 Nguyễn Văn Linh, Q.7",
    status: "received",
    date: "24/03/2025 10:05",
  },
  {
    id: "LAZ250318-9930",
    locker: "LK-01",
    compartment: "A01",
    address: "Số 123 Nguyễn Văn Linh, Q.7",
    status: "received",
    date: "18/03/2025 09:12",
  },
];
