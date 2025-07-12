import { ExternalLink } from "lucide-react";
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
      className="group inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-accent-foreground text-sm transition-all hover:bg-foreground hover:text-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      target="_blank"
      rel="noopener noreferrer"
      {...(token.title && { title: token.title })}
    >
      <span className="inline-flex items-center">
        {token.tokens.map((subToken, index) => (
          <TokenBlock key={getTokenKey(subToken, index)} token={subToken} />
        ))}
      </span>
      <ExternalLink className="size-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
    </a>
  );
}
