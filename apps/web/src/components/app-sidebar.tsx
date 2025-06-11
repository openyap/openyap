import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
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
} from "~/components/ui/sidebar";
import { authClient } from "~/lib/auth/client";
import { ProfileCard } from "./auth/profile-card";

export function AppSidebar() {
  const { data: session } = authClient.useSession();
  const data = useQuery(
    api.functions.chat.getUserChats,
    session ? { sessionToken: session.session.token } : "skip"
  );

  return (
    <Sidebar>
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
                <SidebarMenuItem key={chat._id}>
                  <SidebarMenuButton asChild>
                    <Link
                      key={chat._id}
                      to="/chat/$chatId"
                      params={{ chatId: chat._id }}
                    >
                      {chat.description}
                    </Link>
                  </SidebarMenuButton>
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
