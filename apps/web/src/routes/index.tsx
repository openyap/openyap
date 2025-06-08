import { useState } from "react";
import { useTransition } from "react";
import { CaptchaWidget } from "~/components/auth/captcha-widget";
import { DomainLogo } from "~/components/domains";
import { Button } from "~/components/ui/button";
import { authClient, getClientIP } from "~/lib/auth/client";

export const Route = createFileRoute({
  component: Index,
});

function Index() {
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

  if (session.data?.user) {
    return (
        <div>
          <p>Logged in</p>
          <p>User: {session.data.user.name}</p>
          <Button onClick={() => authClient.signOut()}>Sign out</Button>
        </div>
      );
  }

  return (
    <div>
      <Button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full bg-white text-gray-900 border border-gray-200 hover:bg-gray-50"
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
