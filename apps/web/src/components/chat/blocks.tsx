// import { Icon } from "@iconify/react";
import debounce from "lodash/debounce";
import type { Token, Tokens } from "marked";
import { memo, useEffect, useMemo, useState, useTransition } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  atomDark,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { cn } from "~/lib/utils";
import { useTheme } from "../theme-provider";

function randomKey() {
  return crypto.randomUUID();
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// TODO: Add more languages, or make a library for this
/*
function langIcon(lang: string) {
  if (lang === "javascript") return "vscode-icons:file-type-js";
  if (lang === "typescript") return "vscode-icons:file-type-typescript";
  if (lang === "rust") return "vscode-icons:file-type-rust";
  if (lang === "python") return "vscode-icons:file-type-python";
  if (lang === "cpp") return "vscode-icons:file-type-cpp";
  if (lang === "c") return "vscode-icons:file-type-c";
  if (lang === "kotlin") return "vscode-icons:file-type-kotlin";
  if (lang === "haskell") return "vscode-icons:file-type-haskell";
  if (lang === "ruby") return "vscode-icons:file-type-ruby";
  if (lang === "swift") return "vscode-icons:file-type-swift";
  if (lang === "java") return "vscode-icons:file-type-java";
  if (lang === "go") return "vscode-icons:file-type-go";
  if (lang === "csharp") return "vscode-icons:file-type-csharp";
  if (lang === "jsx" || lang === "tsx") return "vscode-icons:file-type-reactjs";
  if (lang === "sql") return "vscode-icons:file-type-sql";
  if (lang === "bash") return "vscode-icons:file-type-shell";
  if (lang === "html") return "vscode-icons:file-type-html";
  if (lang === "css") return "vscode-icons:file-type-css2";
  if (lang === "json") return "vscode-icons:file-type-json-official";
  if (lang === "php") return "vscode-icons:file-type-php";

  return "";
}
*/

type TokenBlockProps = {
  token: Token;
};

export function TokenBlock({ token }: TokenBlockProps) {
  switch (token.type) {
    case "blockquote":
      return (
        <BlockquoteBlock key={randomKey()} token={token as Tokens.Blockquote} />
      );
    case "br":
      return <BrBlock key={randomKey()} token={token as Tokens.Br} />;
    case "code":
      return (
        <MemoizedCodeBlock key={randomKey()} token={token as Tokens.Code} />
      );
    case "codespan":
      return (
        <CodeSpanBlock key={randomKey()} token={token as Tokens.Codespan} />
      );
    case "del":
      return <DelBlock key={randomKey()} token={token as Tokens.Del} />;
    case "em":
      return <EmBlock key={randomKey()} token={token as Tokens.Em} />;
    case "escape":
      return <EscapeBlock key={randomKey()} token={token as Tokens.Escape} />;
    case "heading":
      return <HeadingBlock key={randomKey()} token={token as Tokens.Heading} />;
    case "hr":
      return <HrBlock key={randomKey()} token={token as Tokens.Hr} />;
    case "image":
      return <ImageBlock key={randomKey()} token={token as Tokens.Image} />;
    case "link":
      return <LinkBlock key={randomKey()} token={token as Tokens.Link} />;
    case "list":
      return <ListBlock key={randomKey()} token={token as Tokens.List} />;
    case "paragraph":
      return (
        <ParagraphBlock key={randomKey()} token={token as Tokens.Paragraph} />
      );
    case "strong":
      return <StrongBlock key={randomKey()} token={token as Tokens.Strong} />;
    case "table":
      return <TableBlock key={randomKey()} token={token as Tokens.Table} />;
    case "text":
      return <TextBlock key={randomKey()} token={token as Tokens.Text} />;
    default:
      return (
        <span key={randomKey()} className="text-base text-foreground">
          {token.raw}
        </span>
      );
  }
}

function StrongBlock({ token }: { token: Tokens.Strong }) {
  if (!token.tokens) {
    return (
      <strong key={randomKey()} className="text-base text-foreground">
        {token.text}
      </strong>
    );
  }
  return (
    <strong key={randomKey()} className="text-foreground">
      {token.tokens.map((t, _i) => (
        <TokenBlock key={randomKey()} token={t} />
      ))}
    </strong>
  );
}

function TextBlock({ token }: { token: Tokens.Text }) {
  if (!token.tokens) {
    return (
      <span key={randomKey()} className="text-foreground">
        {token.text}
      </span>
    );
  }
  return (
    <span key={randomKey()} className="text-foreground">
      {token.tokens.map((t, _i) => (
        <TokenBlock key={randomKey()} token={t} />
      ))}
    </span>
  );
}

function CodeBlock({ token }: { token: Tokens.Code }) {
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [shouldHighlight, setShouldHighlight] = useState<boolean>(false);
  const [pendingHighlight, startTransition] = useTransition();
  const highlightedLang = token.lang ?? "text";
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";

  const triggerHighlight = useMemo(
    () =>
      debounce(() => {
        startTransition(() => {
          setShouldHighlight(true);
        });
      }, 750),
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run only when the incoming text chunk changes
  useEffect(() => {
    setShouldHighlight(false);
    triggerHighlight();
    return () => {
      triggerHighlight.cancel();
    };
  }, [token.text, triggerHighlight]);

  const codeElement = useMemo(() => {
    const commonFont =
      '"Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';

    if (!shouldHighlight || pendingHighlight) {
      return (
        <pre
          className="language-none text-muted-foreground"
          style={{
            background: isDarkTheme ? "#1D1F21" : "#fafafa",
            fontFamily: commonFont,
            whiteSpace: "pre",
            direction: "ltr",
            textAlign: "left",
            wordSpacing: "normal",
            wordBreak: "normal",
            lineHeight: 1.5,
            tabSize: 2,
            hyphens: "none",
            padding: "1em",
            margin: "0.5em 0",
            overflow: "auto",
            borderRadius: "0.3em",
            fontSize: "14px",
          }}
        >
          <code
            style={{
              background: "inherit",
              fontFamily: commonFont,
              whiteSpace: "pre",
              direction: "ltr",
              textAlign: "left",
              wordSpacing: "normal",
              wordBreak: "normal",
              lineHeight: 1.5,
              tabSize: 2,
              hyphens: "none",
            }}
          >
            {token.text}
          </code>
        </pre>
      );
    }
    return (
      <SyntaxHighlighter
        language={highlightedLang}
        style={isDarkTheme ? atomDark : oneLight}
        customStyle={{
          fontSize: "14px",
          fontFamily: commonFont,
        }}
      >
        {token.text}
      </SyntaxHighlighter>
    );
  }, [
    shouldHighlight,
    pendingHighlight,
    highlightedLang,
    token.text,
    isDarkTheme,
  ]);

  async function copyText() {
    setIsChecked(await copyToClipboard(token.text));
    setTimeout(() => setIsChecked(false), 3000);
  }

  return (
    <div
      key={randomKey()}
      className="my-3 overflow-hidden rounded-lg border border-border bg-card shadow"
    >
      <div className="flex justify-between border-border border-b bg-muted px-2 py-2">
        <div className="flex items-center gap-x-1">
          {/* TODO: Move icon state to prevent flickering from re-rendering */}
          {/* {token.lang && (
            <Icon
              icon={langIcon(highlightedLang)}
              className="h-4 w-4 bg-transparent"
            />
          )} */}
          <span className="text-gray-500 text-sm">{highlightedLang}</span>
        </div>
        <button
          type="button"
          onMouseDown={copyText}
          className="flex cursor-pointer items-center justify-center"
        >
          <span
            className={cn(
              "iconify h-4 w-4",
              isChecked
                ? "lucide--check text-green-500"
                : "lucide--copy text-muted-foreground",
            )}
          />
        </button>
      </div>
      <pre className="*:!m-0 overflow-auto bg-background">{codeElement}</pre>
    </div>
  );
}

const MemoizedCodeBlock = memo(CodeBlock);

function CodeSpanBlock({ token }: { token: Tokens.Codespan }) {
  async function copyText() {
    await copyToClipboard(token.text);
  }
  return (
    <code
      key={randomKey()}
      onMouseDown={copyText}
      className="cursor-pointer rounded bg-muted px-1 py-[0.5px] text-base text-foreground"
    >
      {token.text}
    </code>
  );
}

function ParagraphBlock({ token }: { token: Tokens.Paragraph }) {
  if (!token.tokens) {
    return (
      <p key={randomKey()}>
        <span className="text-base text-foreground">{token.text}</span>
      </p>
    );
  }
  return (
    <p key={randomKey()}>
      {token.tokens.map((t, _i) => (
        <TokenBlock key={randomKey()} token={t} />
      ))}
    </p>
  );
}

function ListItemBlock({
  token,
  number,
}: {
  token: Tokens.ListItem;
  number?: number;
}) {
  return (
    <li key={randomKey()}>
      {number && (
        <span className="pr-1 text-base text-muted-foreground">{number}.</span>
      )}
      {(token.tokens ?? []).map((t, _i) => (
        <TokenBlock key={randomKey()} token={t} />
      ))}
    </li>
  );
}

function ListBlock({ token }: { token: Tokens.List }) {
  if (token.ordered) {
    return (
      <ol key={randomKey()}>
        {token.items.map((item: Tokens.ListItem, position: number) => {
          const start =
            typeof token.start === "number" && !Number.isNaN(token.start)
              ? token.start
              : 1;
          const number = position === 0 ? start : position + 1;
          return (
            <ListItemBlock key={randomKey()} token={item} number={number} />
          );
        })}
      </ol>
    );
  }
  return (
    <ul
      key={randomKey()}
      className="list-disc pl-3 text-base text-muted-foreground"
    >
      {token.items.map((item: Tokens.ListItem) => (
        <ListItemBlock key={randomKey()} token={item} />
      ))}
    </ul>
  );
}

function HeadingBlock({ token }: { token: Tokens.Heading }) {
  const depth = Math.min(Math.max(token.depth, 1), 6);
  if (!token.tokens) {
    switch (depth) {
      case 1:
        return (
          <h1 key={randomKey()} className="px-3 py-1 font-bold text-3xl">
            {token.text}
          </h1>
        );
      case 2:
        return (
          <h2 key={randomKey()} className="px-3 py-1 font-semibold text-2xl">
            {token.text}
          </h2>
        );
      case 3:
        return (
          <h3 key={randomKey()} className="px-3 py-1 font-semibold text-xl">
            {token.text}
          </h3>
        );
      case 4:
        return (
          <h4 key={randomKey()} className="px-3 py-1 font-medium text-lg">
            {token.text}
          </h4>
        );
      case 5:
        return (
          <h5 key={randomKey()} className="px-3 py-1 font-medium text-base">
            {token.text}
          </h5>
        );
      case 6:
        return (
          <h6 key={randomKey()} className="px-3 py-1 font-medium text-sm">
            {token.text}
          </h6>
        );
    }
  }
  switch (depth) {
    case 1:
      return (
        <h1 key={randomKey()} className="px-3 py-1 font-bold text-3xl">
          {token.tokens.map((t, _i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h1>
      );
    case 2:
      return (
        <h2 key={randomKey()} className="px-3 py-1 font-semibold text-2xl">
          {token.tokens.map((t, _i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h2>
      );
    case 3:
      return (
        <h3 key={randomKey()} className="px-3 py-1 font-semibold text-xl">
          {token.tokens.map((t, _i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h3>
      );
    case 4:
      return (
        <h4 key={randomKey()} className="px-3 py-1 font-medium text-lg">
          -900 shadow{" "}
          {token.tokens.map((t, _i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h4>
      );
    case 5:
      return (
        <h5 key={randomKey()} className="px-3 py-1 font-medium text-base">
          {token.tokens.map((t, _i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h5>
      );
    case 6:
      return (
        <h6 key={randomKey()} className="px-3 py-1 font-medium text-sm">
          {token.tokens.map((t, _i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h6>
      );
  }
}

function LinkBlock({ token }: { token: Tokens.Link }) {
  return (
    <a
      key={randomKey()}
      href={token.href}
      className="text-blue-500 after:ml-1 after:content-['↗'] hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {token.text}
    </a>
  );
}

function ImageBlock({ token }: { token: Tokens.Image }) {
  return <img key={randomKey()} src={token.href} alt={token.text} />;
}

function BlockquoteBlock({ token }: { token: Tokens.Blockquote }) {
  return (
    <blockquote key={randomKey()} className="border-border border-l-4 pl-4">
      {token.text}
    </blockquote>
  );
}

function DelBlock({ token }: { token: Tokens.Del }) {
  return (
    <del key={randomKey()} className="text-base text-muted-foreground">
      {token.text}
    </del>
  );
}

function EmBlock({ token }: { token: Tokens.Em }) {
  if (!token.tokens) {
    return (
      <em key={randomKey()} className="text-base text-muted-foreground">
        {token.text}
      </em>
    );
  }
  return (
    <em key={randomKey()} className="text-muted-foreground">
      {token.tokens.map((t, _i) => (
        <TokenBlock key={randomKey()} token={t} />
      ))}
    </em>
  );
}

function EscapeBlock({ token }: { token: Tokens.Escape }) {
  return (
    <span key={randomKey()} className="text-base text-muted-foreground">
      {token.text}
    </span>
  );
}

function BrBlock({ token: _ }: { token: Tokens.Br }) {
  return <br key={randomKey()} />;
}

function HrBlock({ token: _ }: { token: Tokens.Hr }) {
  return <hr key={randomKey()} />;
}

function TableBlock({ token }: { token: Tokens.Table }) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border border-border bg-card text-left text-sm">
        <thead className="bg-muted">
          <tr>
            {token.header.map((cell) => (
              <th
                key={randomKey()}
                className={`border-border border-b px-4 py-2 font-semibold text-foreground ${cell.align ? `text-${cell.align}` : ""}`}
                align={cell.align ?? undefined}
              >
                {cell.tokens.map((t) => (
                  <TokenBlock key={randomKey()} token={t} />
                ))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row) => (
            <tr key={randomKey()} className="even:bg-muted">
              {row.map((cell) => (
                <td
                  key={randomKey()}
                  className={`border-border border-b px-4 py-2 text-foreground${cell.align ? `text-${cell.align}` : ""}`}
                  align={cell.align ?? undefined}
                >
                  {cell.tokens.map((t) => (
                    <TokenBlock key={randomKey()} token={t} />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
