import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { useTransition } from "react";
import { CaptchaWidget } from "~/components/auth/captcha-widget";
import { DomainLogo } from "~/components/domains";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { authClient, getClientIP } from "~/lib/auth/client";

export function ProfileCard() {
  const session = authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const [captchaToken, setCaptchaToken] = useState<string>("");

  const handleGoogleLogin = async () => {
    startTransition(async () => {
      const ipAddress = await getClientIP();
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
        console.error(error.message || "Failed to sign in with Google");
        return;
      }
    });
  };

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    console.error(error);
  };

  if (session.isPending) {
    return (
      <div className="flex h-12 animate-pulse items-center justify-center rounded bg-gray-200" />
    );
  }

  if (session.data?.user) {
    return (
      <div className="flex h-12 items-center justify-between rounded border border-gray-200 px-2">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={session.data.user.image ?? ""} />
            <AvatarFallback>
              {session.data.user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <p>{session.data.user.name}</p>
        </div>
        <Button onClick={() => authClient.signOut()}>
          <LogOutIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-12 items-center justify-center rounded border border-gray-200">
      <Button
        type="button"
        onClick={handleGoogleLogin}
        className="h-full w-full bg-white text-gray-900 hover:bg-gray-50"
        disabled={isPending}
      >
        <DomainLogo domain="google.com" />
        Continue with Google
      </Button>
      <CaptchaWidget
        onSuccess={handleCaptchaSuccess}
        onError={handleCaptchaError}
      />
    </div>
  );
}
