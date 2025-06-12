import { marked } from "marked";
import { useMemo } from "react";
import { TokenBlock } from "~/components/blocks";

interface MessageProps {
  content: string;
}

export function Message({ content }: MessageProps) {
  const tokens = useMemo(() => marked.lexer(content), [content]);

  return (
    <div className="whitespace-pre-wrap break-words">
      {tokens.map((token) => {
        return <TokenBlock key={crypto.randomUUID()} token={token} />;
      })}
    </div>
  );
}