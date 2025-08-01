import { Icon } from "@iconify/react";
import { useQuery } from "convex/react";
import { useState } from "react";
import type { MessageId } from "~/components/chat/types";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";

interface EditHistoryPopoverProps {
  messageId: string;
  children: React.ReactNode;
}

function formatHistoryDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  if (date.getFullYear() !== now.getFullYear()) {
    options.year = "numeric";
  }

  return date.toLocaleString("en-US", options);
}

export function EditHistoryPopover({
  messageId,
  children,
}: EditHistoryPopoverProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const { data: session } = authClient.useSession();

  const history = useQuery(
    api.functions.message.getMessageHistory,
    session?.session.token
      ? {
          messageId: messageId as MessageId,
          sessionToken: session.session.token,
        }
      : "skip",
  );

  if (!history || history.length <= 1) {
    return <>{children}</>;
  }

  const index = currentIndex ?? history.length - 1;
  const currentEntry = history[index];
  const isFirst = index === 0;
  const isLast = index === history.length - 1;

  const handlePrevious = () => {
    if (index > 0) setCurrentIndex(index - 1);
  };

  const handleNext = () => {
    if (index < history.length - 1) setCurrentIndex(index + 1);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) setCurrentIndex(null);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-pointer text-gray-500 text-xs hover:underline"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={isFirst}
              className="h-6 w-6 p-0"
            >
              <Icon icon="lucide:chevron-left" className="h-3 w-3" />
            </Button>
            <span className="text-muted-foreground text-xs">
              {index + 1} / {history.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={isLast}
              className="h-6 w-6 p-0"
            >
              <Icon icon="lucide:chevron-right" className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-muted-foreground text-xs">
            {formatHistoryDate(currentEntry.createdAt)}
          </div>
        </div>
        <div className="scrollbar scrollbar-track-transparent scrollbar-thumb-border scrollbar-thumb-rounded-full scrollbar-w-1 max-h-32 overflow-y-auto">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {currentEntry.content}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
