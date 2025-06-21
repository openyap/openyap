import { env } from "~/env";

type LogoConfig = {
  type?: "icon" | "logo" | "symbol";
  theme?: "light" | "dark";
  width?: number;
  height?: number;
};

export function getDomainLogoUrl(
  domain: string,
  config: LogoConfig = {},
): string {
  const { type = "icon", theme, width = 400, height = 400 } = config;
  const brandfetchUrl = "https://cdn.brandfetch.io";
  const size = `w/${width}/h/${height}`;
  const typePath = type !== "icon" ? `/${type}` : "";
  const themePath = theme === "light" ? "/theme/light" : "";
  const key = env.VITE_BRANDFETCH_API_KEY;
  if (!key) throw new Error("Missing Brandfetch API key");
  const path = `${size}${themePath}${typePath}?c=${key}`;
  return `${brandfetchUrl}/${domain}/${path}`;
}

type DomainLogoProps = {
  domain: string;
  config?: LogoConfig;
  alt?: string;
  className?: string;
};

export function DomainLogo({
  domain,
  config,
  alt,
  className,
}: DomainLogoProps) {
  const url = getDomainLogoUrl(domain, config);
  return (
    <img
      src={url}
      alt={alt ?? `${domain} logo`}
      width={config?.width ?? 20}
      height={config?.height ?? 20}
      className={className}
    />
  );
}
