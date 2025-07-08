import { Icon } from "@iconify/react";
import debounce from "lodash/debounce";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Tokens } from "marked";
import { memo, useCallback, useMemo, useState, useTransition } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  atomDark,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";
import { useClipboardCopy } from "~/hooks/use-clipboard-copy";
import { UI_CONSTANTS } from "~/lib/constants";
import { cn } from "~/lib/utils";

const LANGUAGE_ICONS: Record<string, string> = {
  javascript: "vscode-icons:file-type-js",
  js: "vscode-icons:file-type-js",
  typescript: "vscode-icons:file-type-typescript",
  ts: "vscode-icons:file-type-typescript",
  tsx: "vscode-icons:file-type-reactts",
  jsx: "vscode-icons:file-type-reactjs",
  react: "vscode-icons:file-type-reactjs",
  python: "vscode-icons:file-type-python",
  py: "vscode-icons:file-type-python",
  rust: "vscode-icons:file-type-rust",
  rs: "vscode-icons:file-type-rust",
  cpp: "vscode-icons:file-type-cpp",
  c: "vscode-icons:file-type-c",
  java: "vscode-icons:file-type-java",
  kotlin: "vscode-icons:file-type-kotlin",
  kt: "vscode-icons:file-type-kotlin",
  swift: "vscode-icons:file-type-swift",
  go: "vscode-icons:file-type-go",
  ruby: "vscode-icons:file-type-ruby",
  rb: "vscode-icons:file-type-ruby",
  php: "vscode-icons:file-type-php",
  csharp: "vscode-icons:file-type-csharp",
  cs: "vscode-icons:file-type-csharp",
  html: "vscode-icons:file-type-html",
  css: "vscode-icons:file-type-css",
  scss: "vscode-icons:file-type-scss",
  sass: "vscode-icons:file-type-sass",
  json: "vscode-icons:file-type-json-official",
  xml: "vscode-icons:file-type-xml",
  yaml: "vscode-icons:file-type-yaml",
  yml: "vscode-icons:file-type-yaml",
  toml: "vscode-icons:file-type-toml",
  sql: "vscode-icons:file-type-sql",
  bash: "vscode-icons:file-type-shell",
  sh: "vscode-icons:file-type-shell",
  shell: "vscode-icons:file-type-shell",
  powershell: "vscode-icons:file-type-powershell",
  ps1: "vscode-icons:file-type-powershell",
  dockerfile: "vscode-icons:file-type-docker",
  docker: "vscode-icons:file-type-docker",
  markdown: "vscode-icons:file-type-markdown",
  md: "vscode-icons:file-type-markdown",
  text: "vscode-icons:file-type-text",
  txt: "vscode-icons:file-type-text",
  haskell: "vscode-icons:file-type-haskell",
  hs: "vscode-icons:file-type-haskell",
  clojure: "vscode-icons:file-type-clojure",
  clj: "vscode-icons:file-type-clojure",
  elixir: "vscode-icons:file-type-elixir",
  ex: "vscode-icons:file-type-elixir",
  dart: "vscode-icons:file-type-dart",
  lua: "vscode-icons:file-type-lua",
  perl: "vscode-icons:file-type-perl",
  pl: "vscode-icons:file-type-perl",
  r: "vscode-icons:file-type-r",
  scala: "vscode-icons:file-type-scala",
  vim: "vscode-icons:file-type-vim",
  zig: "vscode-icons:file-type-zig",
};

function getLanguageIcon(lang: string): string {
  if (!lang) return "vscode-icons:file-type-text";
  return LANGUAGE_ICONS[lang.toLowerCase()] || "vscode-icons:file-type-text";
}

type CodeBlockProps = {
  token: Tokens.Code;
};

function CodeBlock({ token }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const { isCopied, copy } = useClipboardCopy();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const lineCount = token.text.split("\n").length;
  const shouldShowToggle = lineCount > 15;
  const maxHeight = isExpanded ? "none" : "400px";

  return (
    <div className="group relative my-1 overflow-hidden rounded-lg border border-border bg-muted/50">
      <div className="flex items-center justify-between border-border border-b bg-muted/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2">
            <Icon
              icon={getLanguageIcon(token.lang || "text")}
              className="h-4 w-4 bg-transparent"
            />
            <span className="font-mono text-muted-foreground text-xs uppercase">
              {token.lang || "text"}
            </span>
          </span>
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
      <div className="relative">
        <ScrollArea
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            shouldShowToggle && !isExpanded && "relative",
          )}
          style={{ maxHeight }}
        >
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

        {/* Gradient overlay and expand button */}
        {shouldShowToggle && (
          <>
            {!isExpanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-muted/50 to-transparent" />
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-center pb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={debouncedToggle}
                disabled={isPending}
                className="border border-border/50 bg-muted/80 shadow-sm hover:bg-muted"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Show more
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const MemoizedCodeBlock = memo(CodeBlock);
