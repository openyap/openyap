import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";

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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {import.meta.env.DEV && (
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
        <HeadContent />
      </head>
      <body>
        <SidebarProvider>
          <div className="fixed top-0 left-0 z-50 p-4">
            <SidebarTrigger />
          </div>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
        <Scripts />
        <ReactQueryDevtools initialIsOpen={false} />
        <TanStackRouterDevtools initialIsOpen={false} />
      </body>
    </html>
  );
}
