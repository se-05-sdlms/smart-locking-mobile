import { Redirect } from "expo-router";
import type { JSX } from "react";

import { useAuth } from "@/providers/auth-provider";

export default function Index(): JSX.Element {
  const { isReady, session } = useAuth();

  if (!isReady) return <></>;
  return <Redirect href={session ? "/home" : "/login"} />;
}
