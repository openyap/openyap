import { useQuery as useConvexQuery } from "convex/react";
import { usePersistedQuery } from "~/hooks/use-persisted-query";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";

export function useChatsList() {
  const { data: session } = authClient.useSession();

  const serverChats = useConvexQuery(
    api.functions.chat.getUserChats,
    session ? { sessionToken: session.session.token } : "skip",
  );

  return usePersistedQuery({
    queryKey: ["chats:listMeta"],
    dataSource: serverChats,
    enabled: !!session,
  });
}
