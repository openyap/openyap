import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
  const params = useParams({ strict: false });

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="pt-2">
          <h1 className="text-lg font-semibold text-center">OpenYap</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Button
                onClick={() => {
                  navigate({ to: "/" });
                }}
              >
                New Chat
              </Button>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data?.map((chat) => (
                <SidebarMenuItem key={chat._id} className="group/item">
                  <SidebarMenuButton
                    asChild
                    isActive={"chatId" in params && params.chatId === chat._id}
                    className="group-hover/item:bg-sidebar-accent"
                  >
                    <Link
                      key={chat._id}
                      to="/chat/$chatId"
                      params={{ chatId: chat._id }}
                    >
                      <span className="block truncate max-w-full">
                        {chat.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      await deleteChat({
                        chatId: chat._id,
                        sessionToken: session?.session.token ?? "",
                      });
                      if (params.chatId === chat._id) {
                        navigate({ to: "/" });
                      }
                    }}
                    className="hover:text-destructive hover:cursor-pointer"
                  >
                    <X className="size-4" />
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
