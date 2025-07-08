import type { Tokens } from "marked";

type ImageBlockProps = {
  token: Tokens.Image;
};

export function ImageBlock({ token }: ImageBlockProps) {
  return (
    <img
      src={token.href}
      alt={token.text || ""}
      title={token.title || ""}
      className="my-4 max-w-full rounded-lg border border-border"
    />
  );
}
