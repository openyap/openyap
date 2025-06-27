import { Icon } from "@iconify/react";
import { marked } from "marked";
import { memo, useMemo, useState } from "react";
import { TokenBlock } from "~/components/chat/blocks";
import type {
  ChatMessage,
  StreamingMessage,
  MessageReasoning,
  MessageStatus,
} from "~/components/chat/types";
import { AnimatedShinyText } from "~/components/ui/animated-shiny-text";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { useClipboardCopy } from "~/hooks/use-clipboard-copy";

interface ReasoningCollapsibleProps {
  readonly reasoning: MessageReasoning;
  readonly status: MessageStatus;
}

function formatSeconds(duration: number) {
  const seconds = duration / 1000;
  return seconds.toFixed(0);
}

const ReasoningCollapsible = memo(function ReasoningCollapsible({ reasoning, status }: ReasoningCollapsibleProps) {
  if (!reasoning) return null;
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const reasoningHidden = reasoning.text.length === 0;
  const isReasoning = status === "reasoning";
  const reasoningTitle = `Thought ${reasoning.duration ? `for ${formatSeconds(reasoning.duration)} seconds` : ""}`;

  return (
    <Collapsible open={reasoningOpen} onOpenChange={setReasoningOpen} hidden={reasoningHidden} className="space-y-2">
      <CollapsibleTrigger>
        {!isReasoning ? (
          <div className="flex cursor-pointer items-center gap-x-0.5 text-gray-500">
            {reasoningTitle}
            <motion.span
              animate={{ rotate: reasoningOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "inline-flex" }}
            >
              <Icon icon="lucide:chevron-right" className="h-4 w-4 bg-transparent text-gray-500" />
            </motion.span>
          </div>
        ) : (
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
                {tokens.map((token) => (
                  <TokenBlock key={crypto.randomUUID()} token={token} />
                ))}
              </div>
            </div>
          );
        })}
        {!isReasoning && (
          <div className="flex items-center gap-x-2 text-gray-500">
            <div className="flex w-4 shrink-0 justify-center">
              <Icon icon="lucide:circle-check" className="h-4 w-4 bg-transparent text-gray-500" />
            </div>
            <span className="text-gray-500">Done</span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});

type MessageUnion = ChatMessage | StreamingMessage;

interface MessageProps {
  readonly data: MessageUnion;
}

const Message = memo(function Message({ data }: MessageProps) {
  const { isCopied, copy } = useClipboardCopy();
  const contentTokens = useMemo(() => marked.lexer(data.content), [data.content]);

  const isUser = data.role === "user";
  const isAssistant = data.role === "assistant";
  const error = "error" in data && data.error ? data.error : null;

  return (
    <div className="w-full flex flex-col gap-y-2 group">
      <div className={cn(
        "px-4 py-2 space-y-2",
        isUser && "rounded-lg border border-border bg-sidebar-accent text-sidebar-accent-foreground",
        isAssistant && "text-foreground",
        error && "border-red-500",
      )}>
        <ReasoningCollapsible reasoning={data.reasoning} status={data.status} />
        <div className="whitespace-pre-wrap break-words">
          {contentTokens.map((token) => (
            <TokenBlock key={crypto.randomUUID()} token={token} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-2 min-h-[1.25rem] pl-4">
        <div className="text-red-500 text-xs flex-1 min-w-0 truncate">
          {error}
        </div>
        <div className="flex items-center gap-x-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
          <Button
            type="button"
            onMouseDown={() => copy(data.content)}
            variant="ghost"
            size="icon"
            className="h-4 w-4"
          >
            <Icon
              icon={isCopied ? "lucide:check" : "lucide:copy"}
              className="bg-transparent text-gray-500"
            />
          </Button>
        </div>
      </div>
    </div>
  );
});

interface StreamingAiMessageProps {
  readonly data: StreamingMessage;
}
const StreamingAiMessage = memo(function StreamingAiMessage({ data }: StreamingAiMessageProps) {
  return <Message data={data} />;
});

export { Message, StreamingAiMessage };
