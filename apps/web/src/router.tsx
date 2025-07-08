import { ConvexQueryClient } from "@convex-dev/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProvider } from "convex/react";

import { NotFound } from "~/components/not-found";
import { env } from "~/env";
import { CACHE_CONSTANTS, RETRY_CONSTANTS } from "~/lib/constants";
import { routeTree } from "~/routeTree.gen";

export function createRouter() {
  const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL, {
    logger: false,
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        staleTime: CACHE_CONSTANTS.DURATIONS.ONE_DAY,
        gcTime: CACHE_CONSTANTS.DURATIONS.ONE_DAY,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attemptIndex) =>
          Math.min(
            RETRY_CONSTANTS.BASE_DELAY * 2 ** attemptIndex,
            RETRY_CONSTANTS.MAX_DELAY,
          ),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const persister = createSyncStoragePersister({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  });

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient },
      defaultNotFoundComponent: NotFound,
      defaultPreload: "intent",
      defaultPreloadStaleTime: 0,
      defaultStructuralSharing: true,
      scrollRestoration: true,
      Wrap: (props) => {
        return (
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister,
              maxAge: CACHE_CONSTANTS.DURATIONS.ONE_DAY,
              dehydrateOptions: {
                shouldDehydrateQuery: (q) => {
                  const key = q.queryKey[0];
                  return key === "persisted";
                },
              },
              buster: "v1",
            }}
          >
            <ConvexProvider client={convexQueryClient.convexClient}>
              {props.children}
            </ConvexProvider>
          </PersistQueryClientProvider>
        );
      },
    }),
    queryClient,
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
