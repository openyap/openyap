import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
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

import { useEffect } from "react";
import appCss from "~/styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "OpenYap",
      },
      {
        name: "description",
        content: "Actually open.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [
      {
        children: `!function(){try{var t=localStorage.getItem("local:theme");if(t){var e=JSON.parse(t);if(e?.state?.value){var a=e.state.value;"dark"===a?document.documentElement.classList.add("dark"):"light"===a?document.documentElement.classList.add("light"):"system"===a&&window.matchMedia("(prefers-color-scheme: dark)").matches&&document.documentElement.classList.add("dark")}}}catch(t){}}();`,
      },
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
  useEffect(() => {
    scan({
      enabled: process.env.NODE_ENV === "development",
    });
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system">
          <SidebarProvider>
            <div className="fixed top-0 left-0 z-50 p-4">
              <SidebarTrigger />
            </div>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
        <Scripts />
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        {/* <TanStackRouterDevtools initialIsOpen={false} /> */}
      </body>
    </html>
  );
}
