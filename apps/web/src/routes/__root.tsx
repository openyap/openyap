import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { scan } from "react-scan";
import { AppSidebar } from "~/components/app-sidebar";
import { ThemeProvider } from "~/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { getSidebarState, getTheme } from "~/lib/sidebar";

import { useEffect } from "react";
import appCss from "~/styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  beforeLoad: async () => {
    const [defaultOpen, theme] = await Promise.all([
      getSidebarState(),
      getTheme(),
    ]);
    return { defaultOpen, theme };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "OpenYap",
      },
      {
        name: "description",
        content: "Actually open.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  const { defaultOpen, theme } = useRouteContext({ from: "__root__" });

  useEffect(() => {
    scan({
      enabled: process.env.NODE_ENV === "development",
    });
  }, []);

  const resolvedTheme =
    theme === "system"
      ? "light"
      : theme;

  return (
    <html lang="en" suppressHydrationWarning className={resolvedTheme}>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" serverTheme={theme}>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset>
              <div className="fixed top-4 left-4 z-50 md:hidden">
                <SidebarTrigger />
              </div>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
        <Scripts />
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        {/* <TanStackRouterDevtools initialIsOpen={false} /> */}
      </body>
    </html>
  );
}
