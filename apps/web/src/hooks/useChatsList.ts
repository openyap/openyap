import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { useQuery as useConvexQuery } from "convex/react";
import {
  useQuery as useTanstackQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

export function useChatsList() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const serverChats = useConvexQuery(
    api.functions.chat.getUserChats,
    session ? { sessionToken: session.session.token } : "skip"
  );

  useEffect(() => {
    if (serverChats) {
      queryClient.setQueryData(["chats:listMeta"], serverChats);
    }
  }, [serverChats, queryClient]);

  return useTanstackQuery({
    queryKey: ["chats:listMeta"],
    queryFn: async () => {
      return serverChats || [];
    },
    initialData: serverChats || undefined,
    enabled: !!session,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
