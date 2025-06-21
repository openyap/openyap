import { ConvexHttpClient } from "convex/browser";
import { env } from "~/env";
import { api } from "../../../convex/_generated/api";

export const convexServer = new ConvexHttpClient(env.VITE_CONVEX_URL, {
  logger: false,
});

export { api };
