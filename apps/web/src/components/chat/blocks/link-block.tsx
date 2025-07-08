import type { Tokens } from "marked";
import { TokenBlock } from "~/components/chat/blocks/token-block";
import { getTokenKey } from "~/lib/utils";

type LinkBlockProps = {
  token: Tokens.Link;
};

export function LinkBlock({ token }: LinkBlockProps) {
  return (
    <a
      href={token.href}
      className="text-primary underline hover:text-primary/80"
      target="_blank"
      rel="noopener noreferrer"
      {...(token.title && { title: token.title })}
    >
      {token.tokens.map((subToken, index) => (
        <TokenBlock key={getTokenKey(subToken, index)} token={subToken} />
      ))}
    </a>
  );
}
