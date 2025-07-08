import type { Tokens } from "marked";
import { TokenBlock } from "~/components/chat/blocks/token-block";
import { getTokenKey } from "~/lib/utils";

type ParagraphBlockProps = {
  token: Tokens.Paragraph;
};

export function ParagraphBlock({ token }: ParagraphBlockProps) {
  return (
    <p className="my-1 text-foreground leading-relaxed">
      {token.tokens.map((subToken, index) => (
        <TokenBlock key={getTokenKey(subToken, index)} token={subToken} />
      ))}
    </p>
  );
}
