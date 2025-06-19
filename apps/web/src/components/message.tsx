import { marked } from "marked";
import { useMemo, memo } from "react";
import { TokenBlock } from "~/components/blocks";

interface MessageProps {
  readonly content: string;
}

const MessageComponent = ({ content }: MessageProps) => {
  const tokens = useMemo(() => marked.lexer(content), [content]);

  return (
    <div className="whitespace-pre-wrap break-words">
      {tokens.map((token) => {
        return <TokenBlock key={crypto.randomUUID()} token={token} />;
      })}
    </div>
  );
};

export const Message = memo(MessageComponent);
