import { Icon } from "@iconify/react";
import { marked } from "marked";
import { memo, useMemo, useState } from "react";
import { TokenBlock } from "~/components/chat/blocks";
import type {
  ChatMessage,
  MessageReasoning,
  MessageStatus,
  StreamingMessage,
} from "~/components/chat/types";
import { AnimatedShinyText } from "~/components/ui/animated-shiny-text";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

interface ReasoningCollapsibleProps {
  readonly reasoning: MessageReasoning;
  readonly status: MessageStatus;
}

function formatSeconds(duration: number) {
  const seconds = duration / 1000;
  return seconds.toFixed(0);
}

const ReasoningCollapsible = ({
  reasoning,
  status,
}: ReasoningCollapsibleProps) => {
  if (!reasoning) return null;

  const [reasoningOpen, setReasoningOpen] = useState(false);
  const reasoningHidden = reasoning.text.length === 0;

  const isReasoning = status === "reasoning";
  const reasoningTitle = `Thought ${reasoning.duration ? `for ${formatSeconds(reasoning.duration)} seconds` : ""}`;

  return (
    <Collapsible
      open={reasoningOpen}
      onOpenChange={setReasoningOpen}
      hidden={reasoningHidden}
      className="space-y-2"
    >
      <CollapsibleTrigger>
        {!isReasoning && (
          <div className="flex cursor-pointer items-center gap-x-0.5 text-gray-500">
            {reasoningTitle}
            {reasoningOpen ? (
              <Icon
                icon="lucide:chevron-down"
                className="h-4 w-4 bg-transparent text-gray-500"
              />
            ) : (
              <Icon
                icon="lucide:chevron-right"
                className="h-4 w-4 bg-transparent text-gray-500"
              />
            )}
          </div>
        )}
        {isReasoning && (
          <div className="flex cursor-pointer items-center gap-x-2">
            <AnimatedShinyText>Thinking</AnimatedShinyText>
          </div>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 text-xs">
        {reasoning.details.map((detail) => {
          const tokens = marked.lexer(detail.text);
          return (
            <div key={crypto.randomUUID()} className="flex gap-x-2">
              <div className="flex w-4 shrink-0 flex-col items-center">
                <div className="flex h-5 items-center justify-center">
                  <div className="h-[6px] w-[6px] rounded-full bg-gray-300" />
                </div>
                <div className="w-[1px] flex-grow bg-gray-300" />
              </div>
              <div className="flex-grow">
                {tokens.map((token) => {
                  return <TokenBlock key={crypto.randomUUID()} token={token} />;
                })}
              </div>
            </div>
          );
        })}
        {!isReasoning && (
          <div className="flex items-center gap-x-2 text-gray-500">
            <div className="flex w-4 shrink-0 justify-center">
              <Icon
                icon="lucide:circle-check"
                className="h-4 w-4 bg-transparent text-gray-500"
              />
            </div>
            <span className="text-gray-500">Done</span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface MessageProps {
  readonly data: ChatMessage | StreamingMessage;
}

const MessageComponent = ({ data }: MessageProps) => {
  const contentTokens = useMemo(
    () => marked.lexer(data.content),
    [data.content],
  );

  return (
    <div className="space-y-2">
      <ReasoningCollapsible reasoning={data.reasoning} status={data.status} />
      <div className="whitespace-pre-wrap break-words">
        {contentTokens.map((token) => {
          return <TokenBlock key={crypto.randomUUID()} token={token} />;
        })}
      </div>
    </div>
  );
};

export const Message = memo(MessageComponent);
