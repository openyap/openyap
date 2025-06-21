import { marked } from "marked";
import { useMemo, memo, useState } from "react";
import { TokenBlock } from "~/components/blocks";
import type { ChatMessage, MessageReasoning, MessageStatus, StreamingMessage } from "~/components/chat/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Icon } from "@iconify/react";
import { AnimatedShinyText } from "./ui/animated-shiny-text";

interface ReasoningCollapsibleProps {
  readonly reasoning: MessageReasoning;
  readonly status: MessageStatus;
}

function formatSeconds(duration: number) {
  const seconds = duration / 1000;
  return seconds.toFixed(0);
}

const ReasoningCollapsible = ({ reasoning, status }: ReasoningCollapsibleProps) => {
  if (!reasoning) return null;

  const [reasoningOpen, setReasoningOpen] = useState(false);
  const reasoningHidden = reasoning.steps.length === 0;

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
          <div className="text-gray-500 cursor-pointer flex items-center gap-x-0.5">
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
          <div className="cursor-pointer flex items-center gap-x-2">
            <AnimatedShinyText>Thinking</AnimatedShinyText>
          </div>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="text-xs space-y-2">
        {reasoning.steps.map((step) => {
          const tokens = marked.lexer(step.text);
          return (
            <div key={crypto.randomUUID()} className="flex gap-x-2">
              <div className="flex flex-col w-4 shrink-0 items-center">
                <div className="flex items-center justify-center h-5">
                  <div className="h-[6px] w-[6px] bg-gray-300 rounded-full" />
                </div>
                <div className="w-[1px] bg-gray-300 flex-grow" />
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
            <div className="w-4 shrink-0 flex justify-center">
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
  const contentTokens = useMemo(() => marked.lexer(data.content), [data.content]);

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
