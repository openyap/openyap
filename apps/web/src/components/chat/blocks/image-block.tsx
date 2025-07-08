import { Icon } from "@iconify/react";
import type { Tokens } from "marked";
import { useState } from "react";

type ImageBlockProps = {
  token: Tokens.Image;
};

export function ImageBlock({ token }: ImageBlockProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const altText =
    token.tokens && token.tokens.length > 0
      ? token.tokens.map((t) => (t.type === "text" ? t.text : t.raw)).join("")
      : token.text || "";

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className="my-1 flex max-w-full items-center justify-center rounded-lg border border-border bg-muted/50 p-8">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Icon icon="lucide:image-off" className="h-8 w-8" />
          <span className="text-sm">Failed to load image</span>
          {altText && <span className="text-xs italic">"{altText}"</span>}
        </div>
      </div>
    );
  }

  return (
    <img
      src={token.href}
      alt={altText}
      className={`my-1 max-w-full rounded-lg border border-border transition-opacity ${
        isLoading ? "opacity-50" : "opacity-100"
      }`}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
