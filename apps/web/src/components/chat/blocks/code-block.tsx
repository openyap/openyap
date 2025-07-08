import debounce from "lodash/debounce";
import type { Tokens } from "marked";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  atomDark,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "~/components/theme-provider";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { useClipboardCopy } from "~/hooks/use-clipboard-copy";
import { UI_CONSTANTS } from "~/lib/constants";
import { cn } from "~/lib/utils";

type CodeBlockProps = {
  token: Tokens.Code;
};

function CodeBlock({ token }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const { isCopied, copy } = useClipboardCopy();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // TODO: Fix icon state flickering
  const [_isIconLoaded, setIsIconLoaded] = useState(false);

  const handleCopy = () => {
    copy(token.text);
  };

  const handleToggle = useCallback(() => {
    startTransition(() => {
      setIsExpanded((prev) => !prev);
    });
  }, []);

  const debouncedToggle = useMemo(
    () => debounce(handleToggle, UI_CONSTANTS.ANIMATION.FAST),
    [handleToggle],
  );

  useEffect(() => {
    // Simulate icon loading
    setIsIconLoaded(true);
  }, []);

  const lineCount = token.text.split("\n").length;
  const shouldShowToggle = lineCount > 15;
  const maxHeight = isExpanded ? "none" : "400px";

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-muted/50">
      <div className="flex items-center justify-between border-border border-b bg-muted/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-muted-foreground text-xs uppercase">
            {token.lang || "text"}
          </span>
          {shouldShowToggle && (
            <button
              type="button"
              onClick={debouncedToggle}
              disabled={isPending}
              className="text-muted-foreground text-xs hover:text-foreground"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "text-muted-foreground text-xs transition-colors hover:text-foreground",
            isCopied && "text-green-600",
          )}
        >
          {isCopied ? "Copied!" : "Copy"}
        </button>
      </div>
      <ScrollArea className="overflow-hidden" style={{ maxHeight }}>
        <SyntaxHighlighter
          language={token.lang || "text"}
          style={resolvedTheme === "dark" ? atomDark : oneLight}
          customStyle={{
            margin: 0,
            background: "transparent",
            fontSize: "0.875rem",
            padding: "1rem",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono)",
            },
          }}
        >
          {token.text}
        </SyntaxHighlighter>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

export const MemoizedCodeBlock = memo(CodeBlock);
