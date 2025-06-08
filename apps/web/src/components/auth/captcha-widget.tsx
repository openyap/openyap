import { Turnstile } from "@marsidev/react-turnstile";

// TODO: use this component

type CaptchaWidgetProps = {
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
}

export default function CaptchaWidget({ onSuccess, onError }: CaptchaWidgetProps) {
  return (
    <Turnstile 
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string} 
      onSuccess={onSuccess} 
      onError={onError} 
    />
  )
}