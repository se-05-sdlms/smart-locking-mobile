import { Redirect } from "expo-router";
import type { JSX } from "react";
export default function ReturnsRedirect(): JSX.Element {
  return <Redirect href="/send" />;
}
