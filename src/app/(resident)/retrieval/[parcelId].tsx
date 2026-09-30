import type { JSX } from "react";

import { useLocalSearchParams } from "expo-router";

import { ParcelRetrievalScreen } from "@/features/retrieval/parcel-retrieval-screen";

export default function RetrievalScreen(): JSX.Element {
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  return <ParcelRetrievalScreen parcelId={parcelId} />;
}
