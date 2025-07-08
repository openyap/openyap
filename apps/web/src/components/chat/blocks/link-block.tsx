import type { Tokens } from "marked";
import { TokenBlock } from "./token-block";

type LinkBlockProps = {
  token: Tokens.Link;
};

export function LinkBlock({ token }: LinkBlockProps) {
  return (
    <a
      href={token.href}
      title={token.title || ""}
      className="text-primary underline hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
    >
      {token.tokens.map((subToken) => (
        <TokenBlock key={subToken.raw} token={subToken} />
      ))}
    </a>
  );
}
