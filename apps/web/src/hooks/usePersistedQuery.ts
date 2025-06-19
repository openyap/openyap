import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

interface UsePersistedQueryOptions<T> {
  queryKey: readonly string[];
  dataSource: T | undefined;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

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
