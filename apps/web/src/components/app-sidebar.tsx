import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Pin, PinOff, X } from "lucide-react";
import { Sun, Moon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/seperator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useChatsList } from "~/hooks/use-chats-list";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { ProfileCard } from "./auth/profile-card";
import { useTheme } from "~/components/theme-provider";

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
    <Sidebar>
      <SidebarHeader>
        <div className="pt-2 relative">
          <h1 className="text-center font-semibold text-lg">OpenYap</h1>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <ThemeToggle />
          </div>
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
              <div className="p-1 font-medium text-muted-foreground text-xs">
                Pinned
              </div>
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
                      className="group-hover/item:bg-sidebar-accent"
                    >
                      <Link
                        key={chat._id}
                        to="/chat/$chatId"
                        params={{ chatId: chat._id }}
                      >
                        <Tooltip>
                          <TooltipTrigger className="truncate" asChild>
                            <span className="block max-w-full truncate">
                              {chat.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent hideWhenDetached>
                            <p>{chat.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Link>
                    </SidebarMenuButton>
                    <div className="absolute top-1.5 right-1 z-10 hidden flex-row items-center gap-1 group-hover/item:flex group-hover/item:bg-sidebar-accent">
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
                      <Tooltip>
                        <TooltipTrigger className="truncate" asChild>
                          <span className="block max-w-full truncate">
                            {chat.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent hideWhenDetached>
                          <p>{chat.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </Link>
                  </SidebarMenuButton>
                  <div className="absolute top-1.5 right-1 z-10 hidden flex-row items-center gap-1 group-hover/item:flex group-hover/item:bg-sidebar-accent">
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
      {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
