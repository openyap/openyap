import { createAuthClient } from "better-auth/react"
import { queryOptions } from "@tanstack/react-query";

export const authClient = createAuthClient();

export const sessionQueryOptions = queryOptions({
  queryKey: ["session"],
  queryFn: async () => {
    const session = await authClient.getSession();
    return session.data;
  },
});
