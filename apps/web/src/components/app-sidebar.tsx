import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "~/components/ui/sidebar";
import { authClient } from "~/lib/auth/client";
import { ProfileCard } from "./auth/profile-card";
import { api } from "~/lib/db/server";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useMutation } from "convex/react";

export function AppSidebar() {
  const { data: session } = authClient.useSession();
  const data = useQuery(
    api.functions.chat.getUserChats,
    session ? { sessionToken: session.session.token } : "skip"
  );
  const deleteChat = useMutation(api.functions.chat.deleteChat);
  const navigate = useNavigate();

  return (
    <Sidebar>
      <div className="p-4">
        <h1 className="text-lg font-semibold text-center">OpenYap</h1>
      </div>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <SidebarMenuButton asChild>
              <Link to="/">Chats</Link>
            </SidebarMenuButton>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data?.map((chat) => (
                <SidebarMenuItem key={chat._id} className="hover:bg-gray-200 rounded">
                  <SidebarMenuButton asChild>
                    <Link
                      key={chat._id}
                      to="/chat/$chatId"
                      params={{ chatId: chat._id }}
                    >
                      <span className="block truncate max-w-full">{chat.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    asChild
                    className="top-1/2 -translate-y-1/4"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      tabIndex={-1}
                      aria-label="Delete chat"
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        await deleteChat({
                          chatId: chat._id,
                          sessionToken: session?.session.token ?? "",
                        });
                        navigate({ to: "/" });
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ProfileCard />
      </SidebarFooter>
    </Sidebar>
  );
}

