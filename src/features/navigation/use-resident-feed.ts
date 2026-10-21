import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useMobileDataRevision } from "@/features/notifications/data-sync";
import type { PageResponse } from "@/lib/api-client";

/** Refresh and pagination have separate error states; retries retain already loaded rows. */
export function useResidentFeed<T>(fetchPage: (page: number) => Promise<PageResponse<T>>) {
  const revision = useMobileDataRevision();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [paginationError, setPaginationError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const page = useRef(0),
    generation = useRef(0),
    pending = useRef(false),
    loadedRevision = useRef<number | null>(null);
  const load = useCallback(
    async (reset = true) => {
      if (pending.current || (!reset && loadedRevision.current !== revision)) return;
      pending.current = true;
      const request = reset ? ++generation.current : generation.current;
      const nextPage = reset ? 1 : page.current + 1;
      if (reset) {
        setRefreshing(true);
        setLoadingMore(false);
        setError("");
        setPaginationError("");
      } else {
        setLoadingMore(true);
        setPaginationError("");
      }
      try {
        const result = await fetchPage(nextPage);
        if (request !== generation.current) return;
        const incoming = Array.isArray(result) ? result : result.items;
        setItems((current) => (reset ? incoming : [...current, ...incoming]));
        page.current = nextPage;
        loadedRevision.current = revision;
        setHasMore(
          !Array.isArray(result) && result.pageNumber * result.pageSize < result.totalCount
        );
      } catch (failure) {
        if (request !== generation.current) return;
        const message =
          failure instanceof Error ? failure.message : "Không thể tải dữ liệu. Vui lòng thử lại.";
        if (reset) setError(message);
        else setPaginationError(message);
      } finally {
        if (request === generation.current) {
          pending.current = false;
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage, revision]
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        generation.current++;
        pending.current = false;
      };
    }, [load])
  );
  const refresh = useCallback(() => void load(), [load]);
  const loadMore = useCallback(() => {
    if (hasMore && !error && !paginationError) void load(false);
  }, [hasMore, error, paginationError, load]);
  const retryMore = useCallback(() => {
    if (hasMore) void load(false);
  }, [hasMore, load]);
  return {
    items,
    setItems,
    loading,
    refreshing,
    loadingMore,
    error,
    paginationError,
    hasMore,
    refresh,
    loadMore,
    retryMore,
  };
}
