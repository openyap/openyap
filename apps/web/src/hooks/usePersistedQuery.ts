import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

/**
 * Options for the usePersistedQuery hook
 * @template T The type of data being queried
 * @param queryKey - Array of strings that uniquely identify this query. Will be prefixed with "persisted" automatically
 * @param dataSource - The reactive data source (e.g., from Convex, fetch, etc.) to sync with TanStack Query
 * @param enabled - Whether the query should be enabled. Defaults to true
 * @param staleTime - Time in milliseconds that data is considered fresh. Inherits from global config if not provided
 * @param gcTime - Time in milliseconds that unused/inactive cache data remains in memory. Inherits from global config if not provided. Set to `Infinity` to disable garbage collection
 */
interface UsePersistedQueryOptions<T> {
  queryKey: readonly string[];
  dataSource: T | undefined;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

/**
 * A hook that automatically syncs data from any reactive source with TanStack Query and persists it to localStorage.
 *
 * This hook bridges reactive data sources (like Convex queries) with TanStack Query's caching system,
 * automatically persisting the data to localStorage for offline access and faster initial loads.
 *
 * @template T The type of data being queried
 * @param options Configuration options for the persisted query
 * @returns TanStack Query result object with the synced and persisted data
 *

 */
export function usePersistedQuery<T>({
  queryKey,
  dataSource,
  enabled = true,
  staleTime,
  gcTime,
}: UsePersistedQueryOptions<T>) {
  const queryClient = useQueryClient();

  const queryKeyString = JSON.stringify(queryKey);
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally use queryKeyString to stabilize the array reference
  const stableQueryKey = useMemo(
    () => ["persisted", ...queryKey],
    [queryKeyString]
  );

  useEffect(() => {
    if (dataSource !== undefined) {
      queryClient.setQueryData(stableQueryKey, dataSource);
    }
  }, [dataSource, queryClient, stableQueryKey]);

  return useQuery({
    queryKey: stableQueryKey,
    queryFn: async () => {
      return dataSource || [];
    },
    initialData: dataSource || undefined,
    enabled,
    ...(staleTime !== undefined && { staleTime }),
    ...(gcTime !== undefined && { gcTime }),
  });
}
