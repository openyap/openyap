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
import { ProfileAvatar } from "../auth/profile-avatar";
import type { User } from "better-auth";

interface ReasoningCollapsibleProps {
  readonly reasoning: MessageReasoning;
  readonly status: MessageStatus;
}

function formatSeconds(duration: number) {
  const seconds = duration / 1000;
  return seconds.toFixed(0);
}

function formatDate(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const hour = date.getHours() % 12 || 12;
  const minuteStr = date.getMinutes().toString().padStart(2, "0");
  const ampm = date.getHours() >= 12 ? " PM" : " AM";
  const time = `${hour}:${minuteStr}${ampm}`;
  if (isToday) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday at ${time}`;
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} at ${time}`;
}

const ReasoningCollapsible = memo(function ReasoningCollapsible({
  reasoning,
  status,
}: ReasoningCollapsibleProps) {
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
        {!isReasoning ? (
          <div className="flex cursor-pointer items-center gap-x-0.5 text-gray-500">
            {reasoningTitle}
            <motion.span
              animate={{ rotate: reasoningOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "inline-flex" }}
            >
              <Icon
                icon="lucide:chevron-right"
                className="h-4 w-4 bg-transparent text-gray-500"
              />
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
});

interface MessageProps {
  readonly data: ChatMessage;
  readonly user?: User;
}

const Message = memo(function Message({ data, user }: MessageProps) {
  const { isCopied, copy } = useClipboardCopy();
  const contentTokens = useMemo(
    () => marked.lexer(data.content),
    [data.content]
  );

  const isUser = data.role === "user";
  const isAssistant = data.role === "assistant";
  const name = user?.name ?? "Unknown";
  const date = formatDate(new Date(data?._creationTime));
  const error = "error" in data && data.error ? data.error : null;

  return (
    <motion.div
      className="max-w-full flex flex-col gap-y-2 group"
      {...(isUser
        ? {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.25 },
          }
        : {})}
    >
      <div
        className={cn(
          "py-2 space-y-2",
          isUser &&
            "px-3 rounded-lg border border-border bg-sidebar-accent text-sidebar-accent-foreground",
          isAssistant && "text-foreground",
          error && "border-red-500"
        )}
      >
        {isAssistant && (
          <ReasoningCollapsible
            reasoning={data.reasoning}
            status={data.status}
          />
        )}
        <div className="flex gap-x-3 min-w-0">
          {isUser && (
            <ProfileAvatar
              image={user?.image ?? ""}
              name={user?.name ?? ""}
              className="size-6"
            />
          )}
          <div className="flex flex-col gap-y-0.5 min-w-0">
            <div className="flex items-center gap-x-1.5">
              {isUser && <div className="text-xs text-gray-500">{name}</div>}
              {isUser && <div className="text-xs text-gray-500">{date}</div>}
            </div>
            <div className="whitespace-pre-wrap break-words min-w-0">
              {contentTokens.map((token) => (
                <TokenBlock key={crypto.randomUUID()} token={token} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-2 min-h-[1.25rem] pl-3">
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
    </motion.div>
  );
});

interface StreamingAiMessageProps {
  readonly data: StreamingMessage;
}
const StreamingAiMessage = memo(function StreamingAiMessage({
  data,
}: StreamingAiMessageProps) {
  const { isCopied, copy } = useClipboardCopy();
  const contentTokens = useMemo(
    () => marked.lexer(data.content),
    [data.content]
  );

  const error = "error" in data && data.error ? data.error : null;

  return (
    <div className="max-w-full flex flex-col gap-y-2 group">
      <div className={cn("px-3 py-2 space-y-2 text-foreground")}>
        <ReasoningCollapsible reasoning={data.reasoning} status={data.status} />
        <div className="flex items-center gap-x-2 min-w-0">
          <div className="whitespace-pre-wrap break-words min-w-0">
            {contentTokens.map((token) => (
              <TokenBlock key={crypto.randomUUID()} token={token} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-x-2 min-h-[1.25rem] pl-3">
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

export { Message, StreamingAiMessage };
