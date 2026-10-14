import { useEffect, useState } from "react";

import { accountPackageApi } from "@/features/account-packages/api";
import type { AccountPackage } from "@/features/account-packages/types";

export function usePackagePlans() {
  const [plans, setPlans] = useState<AccountPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void accountPackageApi
      .getPlans()
      .then((items) => {
        if (active) setPlans(items.filter((item) => item.isActive));
      })
      .catch((e: unknown) => {
        if (active) {
          setPlans([]);
          setError(e instanceof Error ? e.message : "Không thể tải danh sách gói.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  return { plans, loading, error, reload: () => setRevision((value) => value + 1) };
}
