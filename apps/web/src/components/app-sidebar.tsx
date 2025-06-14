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
import { Pin, PinOff, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useMutation } from "convex/react";
import { Separator } from "~/components/ui/seperator";

export function AppSidebar() {
  const { data: session } = authClient.useSession();
  const data = useQuery(
    api.functions.chat.getUserChats,
    session ? { sessionToken: session.session.token } : "skip"
  );
  const deleteChat = useMutation(api.functions.chat.deleteChat);
  const pinChat = useMutation(api.functions.chat.pinChat);
  const unpinChat = useMutation(api.functions.chat.unpinChat);
  const navigate = useNavigate();
  const params = useParams({ strict: false });

  const pinned = (data ?? [])
    .filter((chat) => !!chat.pinnedAt)
    .sort((a, b) => (b.pinnedAt ?? "").localeCompare(a.pinnedAt ?? ""));
  const unpinned = (data ?? []).filter((chat) => !chat.pinnedAt);

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
        <Separator />
        {pinned.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="p-1 text-xs font-medium text-muted-foreground">Pinned</div>
              <SidebarMenu>
                {pinned.map((chat) => (
                  <SidebarMenuItem key={chat._id} className="group/item relative">
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
                    <div className="hidden absolute right-1 top-1.5 z-10 group-hover/item:flex flex-row gap-1 items-center group-hover/item:bg-sidebar-accent">
                      <SidebarMenuAction
                        showOnHover
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          await unpinChat({
                            chatId: chat._id,
                            sessionToken: session?.session.token ?? "",
                          });
                        }}
                        className="static hover:text-blue-500 hover:cursor-pointer"
                      >
                        <PinOff className="size-4" />
                      </SidebarMenuAction>
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
                        className="static hover:text-destructive hover:cursor-pointer"
                      >
                        <X className="size-4" />
                      </SidebarMenuAction>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {unpinned.map((chat) => (
                <SidebarMenuItem key={chat._id} className="group/item relative">
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
                  <div className="hidden absolute right-1 top-1.5 z-10 group-hover/item:flex flex-row gap-1 items-center group-hover/item:bg-sidebar-accent">
                    <SidebarMenuAction
                      showOnHover
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        await pinChat({
                          chatId: chat._id,
                          sessionToken: session?.session.token ?? "",
                        });
                      }}
                      className="static hover:text-blue-500 hover:cursor-pointer"
                    >
                      <Pin className="size-4" />
                    </SidebarMenuAction>
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
                      className="static hover:text-destructive hover:cursor-pointer"
                    >
                      <X className="size-4" />
                    </SidebarMenuAction>
                  </div>
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
