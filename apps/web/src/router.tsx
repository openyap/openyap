import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  persistQueryClient,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";

import { routeTree } from "./routeTree.gen";
import { env } from "~/env";
import { NotFound } from "./components/not-found";

export function createRouter() {
  const convexQueryClient = new ConvexQueryClient(env.VITE_CONVEX_URL, {
    logger: false,
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 1000 * 60 * 60 * 24,
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
              dehydrateOptions: {
                shouldDehydrateQuery: (q) => q.queryKey[0] === "chats:listMeta",
              },
            }}
          >
            <ConvexProvider client={convexQueryClient.convexClient}>
              {props.children}
            </ConvexProvider>
          </PersistQueryClientProvider>
        );
      },
    }),
    queryClient
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
