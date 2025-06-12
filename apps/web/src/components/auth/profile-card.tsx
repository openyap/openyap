import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { useTransition } from "react";
import { CaptchaWidget } from "~/components/auth/captcha-widget";
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
      <div className="h-12 animate-pulse bg-gray-200 flex items-center justify-center rounded">
      </div>
    );
  }

  if (session.data?.user) {
    return (
        <div className="h-12 flex items-center justify-between border border-gray-200 rounded px-2">
          <p>{session.data.user.name}</p>
          <Button onClick={() => authClient.signOut()} className="hover:bg-gray-200">
            <LogOutIcon className="w-4 h-4" />
          </Button>
        </div>
      );
  }

  return (
    <div className="h-12 flex items-center justify-center border border-gray-200 rounded">
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
