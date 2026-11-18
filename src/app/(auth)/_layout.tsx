import { Redirect, Slot } from "expo-router";
import type { JSX } from "react";

import { useAuth } from "@/features/auth/auth-context";

export default function AuthLayout(): JSX.Element {
  const { initializing, user } = useAuth();
  if (!initializing && user) return <Redirect href="/" />;
  return <Slot />;
}
