import type { Tokens } from "marked";
import { TokenBlock } from "./token-block";

type ParagraphBlockProps = {
  token: Tokens.Paragraph;
};

export function ParagraphBlock({ token }: ParagraphBlockProps) {
  return (
    <p className="my-3 text-foreground leading-relaxed">
      {token.tokens.map((subToken) => (
        <TokenBlock key={subToken.raw} token={subToken} />
      ))}
    </p>
  );
}
