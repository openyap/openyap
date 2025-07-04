import { auth } from "~/lib/auth/server";

export const ServerRoute = createServerFileRoute().methods({
  GET: ({ request }) => {
    return auth.handler(request);
  },
  POST: ({ request }) => {
    return auth.handler(request);
  },
});
