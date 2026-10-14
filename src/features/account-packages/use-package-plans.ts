import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { accountPackageApi } from "@/features/account-packages/api";
import type { AccountPackage } from "@/features/account-packages/types";
import { useMobileDataRevision } from "@/features/notifications/data-sync";

export function usePackagePlans() {
  const [plans, setPlans] = useState<AccountPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dataRevision = useMobileDataRevision();
  const request = useRef(0);

  const refresh = useCallback(async (): Promise<AccountPackage[]> => {
    const id = ++request.current;
    setLoading(true);
    setError("");
    try {
      const items = (await accountPackageApi.getPlans()).filter((item) => item.isActive);
      if (id === request.current) setPlans(items);
      return items;
    } catch (e) {
      if (id === request.current) {
        setPlans([]);
        setError(e instanceof Error ? e.message : "Không thể tải danh sách gói.");
      }
      throw e;
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh().catch(() => undefined);
    return () => {
      request.current += 1;
    };
  }, [dataRevision, refresh]));

  return {
    plans,
    loading,
    error,
    refresh,
    reload: () => { void refresh().catch(() => undefined); },
  };
}
