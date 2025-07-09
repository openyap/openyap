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
      className="group inline-flex items-end gap-1 rounded-sm text-primary underline-offset-4 transition-all hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
