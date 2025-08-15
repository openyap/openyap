import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const THEME_COOKIE_NAME = "theme";

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );
}

export const getSidebarState = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getWebRequest();
    const cookies = parseCookies(request.headers.get("cookie"));
    return cookies[SIDEBAR_COOKIE_NAME] === "true";
  },
);

export const getTheme = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  const cookies = parseCookies(request.headers.get("cookie"));
  const theme = cookies[THEME_COOKIE_NAME];

  if (theme === "dark" || theme === "light" || theme === "system") {
    return theme;
  }

  return "system";
});
