import { Icon } from "@iconify/react";
import type { User } from "better-auth";
import { useQuery } from "convex/react";
import { marked } from "marked";
import { motion } from "motion/react";
import { memo, useMemo, useState } from "react";
import { ProfileAvatar } from "~/components/auth/profile-avatar";
import { AttachmentList } from "~/components/chat/attachment-preview";
import { TokenBlock } from "~/components/chat/blocks";
import type {
  ChatMessage,
  MessageReasoning,
  MessageStatus,
} from "~/components/chat/types";
import type { MessageId } from "~/components/chat/types";
import { AnimatedShinyText } from "~/components/ui/animated-shiny-text";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { useClipboardCopy } from "~/hooks/use-clipboard-copy";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { getTokenKey } from "~/lib/utils";
import { cn } from "~/lib/utils";

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
      <CollapsibleContent forceMount asChild>
        <motion.div
          initial="collapsed"
          animate={reasoningOpen ? "open" : "collapsed"}
          variants={{
            open: { height: "auto", opacity: 1 },
            collapsed: { height: 0, opacity: 0 },
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ overflow: "hidden" }}
          className="space-y-2 text-xs"
        >
          {reasoning.details.map((detail) => {
            const tokens = marked.lexer(detail.text);
            return (
              <div key={detail.text.slice(0, 100)} className="flex gap-x-2">
                <div className="flex w-4 shrink-0 flex-col items-center">
                  <div className="flex h-5 items-center justify-center">
                    <div className="h-[6px] w-[6px] rounded-full bg-gray-300" />
                  </div>
                  <div className="w-[1px] flex-grow bg-gray-300" />
                </div>
                <div className="flex-grow">
                  {tokens.map((token, tokenIndex) => (
                    <TokenBlock
                      key={getTokenKey(token, tokenIndex)}
                      token={token}
                    />
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
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
});

function MessageAttachments({ messageId }: { messageId: string }) {
  const { data: session } = authClient.useSession();
  const attachments = useQuery(
    api.functions.attachment.getMessageAttachments,
    session?.session.token
      ? {
          messageId: messageId as MessageId,
          sessionToken: session.session.token,
        }
      : "skip",
  );

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const formattedAttachments = attachments.map((attachment) => ({
    id: attachment._id,
    type: attachment.type,
    url: attachment.url,
    name: attachment.name,
    size: attachment.size,
    mimeType: attachment.mimeType,
  }));

  return (
    <div className="my-2">
      <AttachmentList attachments={formattedAttachments} />
    </div>
  );
}

interface MessageProps {
  readonly data: ChatMessage;
  readonly user?: User;
}

export const Message = function Message({ data, user }: MessageProps) {
  const { isCopied, copy } = useClipboardCopy();
  const contentTokens = useMemo(
    () => marked.lexer(data.content),
    [data.content],
  );

  const isUser = data.role === "user";
  const isAssistant = data.role === "assistant";
  const name = user?.name ?? "Unknown";
  const date = formatDate(new Date(data?._creationTime));
  const error = "error" in data && data.error ? data.error : null;

  return (
    <div className="group flex max-w-full flex-col gap-y-2">
      <div
        className={cn(
          "mx-2 space-y-2 px-3 py-2",
          isUser &&
            "rounded-lg border border-border bg-sidebar-accent text-sidebar-accent-foreground",
          isAssistant && "text-foreground",
          error && "border-red-500",
        )}
      >
        {isAssistant && (
          <ReasoningCollapsible
            reasoning={data.reasoning}
            status={data.status}
          />
        )}
        <div className="flex min-w-0 gap-x-3">
          {isUser && (
            <ProfileAvatar
              image={user?.image ?? ""}
              name={user?.name ?? ""}
              className="size-6"
            />
          )}
          <div className="flex min-w-0 flex-col gap-y-0.5">
            <div className="flex items-center gap-x-1.5">
              {isUser && <div className="text-gray-500 text-xs">{name}</div>}
              {isUser && <div className="text-gray-500 text-xs">{date}</div>}
            </div>
            <div className="min-w-0 whitespace-pre-wrap break-words">
              {contentTokens.map((token, index) => (
                <TokenBlock key={getTokenKey(token, index)} token={token} />
              ))}
            </div>
            <MessageAttachments messageId={data._id} />
          </div>
        </div>
      </div>
      <div className="flex min-h-[1.25rem] items-center justify-between gap-x-2 px-3">
        <div className="min-w-0 flex-1 truncate text-red-500 text-xs">
          {error}
        </div>
        <div className="flex items-center gap-x-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
};

export const MemoizedMessage = memo(Message);
