import { Turnstile } from "@marsidev/react-turnstile";
import { env } from "~/env";

type CaptchaWidgetProps = {
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
}

export function CaptchaWidget({ onSuccess, onError }: CaptchaWidgetProps) {
  return (
    <Turnstile 
      siteKey={env.VITE_TURNSTILE_SITE_KEY} 
      onSuccess={onSuccess} 
      onError={onError} 
    />
  )
}