import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { createAuthClient } from "better-auth/react";
import { auth } from "~/lib/auth/server";

export const authClient = createAuthClient();

export const getClientIP = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getWebRequest();
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");

    const ip =
      forwarded?.split(",")[0].trim() || realIP || cfConnectingIP || "unknown";

    return ip;
  },
);

export const getServerSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getWebRequest()?.headers ?? new Headers(),
    });
    return session;
  },
);
