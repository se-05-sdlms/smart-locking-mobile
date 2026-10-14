import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useMobileDataRevision } from "@/features/notifications/data-sync";
import type { PageResponse } from "@/lib/api-client";

/** Paged resident feeds retain tab state and refresh when revisited or notified. */
export function useResidentFeed<T>(fetchPage: (page: number) => Promise<PageResponse<T>>) {
  const revision = useMobileDataRevision();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const page = useRef(0);
  const generation = useRef(0);
  const pending = useRef(false);

  const load = useCallback(
    async (reset = true) => {
      if (!reset && pending.current) return;
      const request = reset ? ++generation.current : generation.current;
      const nextPage = reset ? 1 : page.current + 1;
      pending.current = true;
      if (reset) setRefreshing(true);
      else setLoadingMore(true);
      setError("");
      try {
        const result = await fetchPage(nextPage);
        if (request !== generation.current) return;
        const incoming = Array.isArray(result) ? result : result.items;
        setItems((current) => (reset ? incoming : [...current, ...incoming]));
        page.current = nextPage;
        setHasMore(
          !Array.isArray(result) && result.pageNumber * result.pageSize < result.totalCount
        );
      } catch (failure) {
        if (request === generation.current)
          setError(
            failure instanceof Error ? failure.message : "Không thể tải dữ liệu. Vui lòng thử lại."
          );
      } finally {
        if (request === generation.current) {
          pending.current = false;
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        generation.current++;
        pending.current = false;
      };
    }, [load, revision])
  );

  const refresh = useCallback(() => void load(), [load]);
  const loadMore = useCallback(() => {
    if (hasMore && !error) void load(false);
  }, [hasMore, error, load]);
  return { items, setItems, loading, refreshing, loadingMore, error, hasMore, refresh, loadMore };
}
