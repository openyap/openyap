import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

export const getSidebarState = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getWebRequest();
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) return false;

    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return cookies[SIDEBAR_COOKIE_NAME] === "true";
  },
);
