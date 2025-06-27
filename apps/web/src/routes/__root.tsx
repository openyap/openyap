import { scan } from "react-scan";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppSidebar } from "~/components/app-sidebar";
import { ThemeProvider } from "~/components/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";

import appCss from "~/styles.css?url";
import { useEffect } from "react";

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
    scripts: [],
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
      enabled: false,
      showToolbar: false,
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
