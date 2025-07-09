import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Pin, PinOff, Plus, X } from "lucide-react";
import { Moon, Sun } from "lucide-react";
import { ProfileCard } from "~/components/auth/profile-card";
import { useTheme } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/seperator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useChatsList } from "~/hooks/use-chats-list";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";

export function AppSidebar() {
  const { data: session } = authClient.useSession();
  const { data } = useChatsList();
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Link
              to="/"
              className="flex items-center font-semibold text-lg group-data-[collapsible=icon]:hidden"
            >
              OpenYap
            </Link>
          </div>
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    navigate({ to: "/" });
                  }}
                  tooltip="New Chat"
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator className="group-data-[collapsible=icon]:hidden" />
        {pinned.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Pinned</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pinned.map((chat) => (
                  <SidebarMenuItem
                    key={chat._id}
                    className="group/item relative"
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={
                        "chatId" in params && params.chatId === chat._id
                      }
                      tooltip={chat.title}
                      className="group-hover/item:bg-sidebar-accent"
                    >
                      <Link
                        key={chat._id}
                        to="/chat/$chatId"
                        params={{ chatId: chat._id }}
                      >
                        <span>{chat.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    <div className="absolute top-1.5 right-1 z-10 hidden flex-row items-center gap-1 group-hover/item:flex group-hover/item:bg-sidebar-accent group-data-[collapsible=icon]:hidden">
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                            className="static hover:cursor-pointer hover:text-blue-500"
                          >
                            <PinOff className="size-4" />
                          </SidebarMenuAction>
                        </TooltipTrigger>
                        <TooltipContent hideWhenDetached>
                          <p>Unpin</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                            className="static hover:cursor-pointer hover:text-destructive"
                          >
                            <X className="size-4" />
                          </SidebarMenuAction>
                        </TooltipTrigger>
                        <TooltipContent hideWhenDetached>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              {unpinned.map((chat) => (
                <SidebarMenuItem key={chat._id} className="group/item relative">
                  <SidebarMenuButton
                    asChild
                    isActive={"chatId" in params && params.chatId === chat._id}
                    tooltip={chat.title}
                    className="group-hover/item:bg-sidebar-accent"
                  >
                    <Link
                      key={chat._id}
                      to="/chat/$chatId"
                      params={{ chatId: chat._id }}
                    >
                      <span>{chat.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  <div className="absolute top-1.5 right-1 z-10 hidden flex-row items-center gap-1 group-hover/item:flex group-hover/item:bg-sidebar-accent group-data-[collapsible=icon]:hidden">
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                          className="static hover:cursor-pointer hover:text-blue-500"
                        >
                          <Pin className="size-4" />
                        </SidebarMenuAction>
                      </TooltipTrigger>
                      <TooltipContent hideWhenDetached>
                        <p>Pin</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                          className="static hover:cursor-pointer hover:text-destructive"
                        >
                          <X className="size-4" />
                        </SidebarMenuAction>
                      </TooltipTrigger>
                      <TooltipContent hideWhenDetached>
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
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

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="ml-2"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
