import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { useTransition } from "react";
import { CaptchaWidget } from "~/components/auth/captcha-widget";
import { ProfileAvatar } from "~/components/auth/profile-avatar";
import { DomainLogo } from "~/components/domains";
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
      <div className="flex h-12 items-center justify-between rounded-md border border-border px-2 dark:border-border">
        <div className="flex items-center gap-2">
          <ProfileAvatar
            image={session.data.user.image ?? ""}
            name={session.data.user.name ?? ""}
          />
          <p>{session.data.user.name}</p>
        </div>
        <Button onClick={() => authClient.signOut()}>
          <LogOutIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-12 items-center justify-center rounded">
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
