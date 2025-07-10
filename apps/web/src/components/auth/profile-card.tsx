import { useNavigate } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { useTransition } from "react";
import { CaptchaWidget } from "~/components/auth/captcha-widget";
import { DomainLogo } from "~/components/domains";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { authClient, getClientIP } from "~/lib/auth/client";
import { logger } from "~/lib/logger";

export function ProfileCard() {
  const session = authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/" });
  };

  const handleGoogleLogin = async () => {
    startTransition(async () => {
      const ipAddress = await getClientIP();
      try {
        const { error } = await authClient.signIn.social({
          provider: "google",
          callbackURL: "/",
          fetchOptions: {
            headers: {
              "x-captcha-response": captchaToken,
              "x-captcha-user-remote-ip": ipAddress ?? "",
            },
          },
        });
        if (error) {
          logger.error(
            `Google OAuth sign-in failed: ${error.message || "Unknown error"}`,
          );
          return;
        }
      } catch (error: unknown) {
        logger.error(
          `Google OAuth request failed: ${error instanceof Error ? error.message : "Network or configuration error"}`,
        );
        return;
      }
    });
  };

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    logger.error(`CAPTCHA validation failed: ${error}`);
  };

  if (session.isPending) {
    return (
      <div className="!justify-start flex h-10 w-full min-w-8 cursor-pointer flex-row items-center gap-3 px-[2px]">
        <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-full bg-gray-200" />
        <div className="group-data-[collapsible=icon]:-translate-x-0.5 block w-full min-w-0 max-w-full overflow-hidden transition-all duration-200 group-data-[collapsible=icon]:opacity-0">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (session.data?.user) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="!justify-start flex h-10 w-full min-w-8 cursor-pointer flex-row items-center gap-3 px-[2px] hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground group-data-[collapsible=icon]:hover:bg-transparent"
          >
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarImage src={session.data.user.image ?? ""} />
              <AvatarFallback>
                {session.data.user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="group-data-[collapsible=icon]:-translate-x-0.5 block w-full min-w-0 max-w-full overflow-hidden truncate text-start font-medium text-sm transition-all duration-200 group-data-[collapsible=icon]:opacity-0">
              {session.data.user.name}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[239px] p-2" align="start" side="top">
          <div className="space-y-2">
            <div className="p-1">
              <p className="font-medium text-sm">{session.data.user.name}</p>
              <p className="text-muted-foreground text-xs">
                {session.data.user.email}
              </p>
            </div>
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full cursor-pointer justify-start"
                onClick={handleSignOut}
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex h-10 items-center justify-center rounded-md">
      <Button
        variant="ghost"
        onClick={handleGoogleLogin}
        className="!justify-start flex h-full w-full min-w-8 cursor-pointer flex-row items-center gap-3 px-[2px] hover:bg-accent hover:text-accent-foreground group-data-[collapsible=icon]:hover:bg-transparent"
        disabled={isPending}
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center">
          <DomainLogo domain="google.com" config={{ type: "symbol" }} />
        </div>
        <span className="group-data-[collapsible=icon]:-translate-x-0.5 block w-full min-w-0 max-w-full overflow-hidden truncate text-start font-medium text-sm transition-all duration-200 group-data-[collapsible=icon]:opacity-0">
          Continue with Google
        </span>
      </Button>
      <CaptchaWidget
        onSuccess={handleCaptchaSuccess}
        onError={handleCaptchaError}
      />
    </div>
  );
}
