import type { Token, Tokens } from "marked";
import { useState, memo, useMemo, useEffect, useTransition } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { cn } from "~/lib/utils";
import { Icon } from "@iconify/react";
import debounce from "lodash/debounce";

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
        <span key={randomKey()} className="text-gray-800 text-base">
          {token.raw}
        </span>
      );
  }
}

function StrongBlock({ token }: { token: Tokens.Strong }) {
  if (!token.tokens) {
    return (
      <strong key={randomKey()} className="text-gray-900 text-base">
        {token.text}
      </strong>
    );
  }
  return (
    <strong key={randomKey()} className="text-gray-900">
      {token.tokens.map((t, i) => (
        <TokenBlock key={randomKey()} token={t} />
      ))}
    </strong>
  );
}

function TextBlock({ token }: { token: Tokens.Text }) {
  if (!token.tokens) {
    return (
      <span key={randomKey()} className="text-gray-800">
        {token.text}
      </span>
    );
  }
  return (
    <span key={randomKey()} className="text-gray-800">
      {token.tokens.map((t, i) => (
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

  const triggerHighlight = useMemo(
    () =>
      debounce(() => {
        startTransition(() => {
          setShouldHighlight(true);
        });
      }, 1000),
    []
  );

  // biome-ignore lint: exhaustive-deps — re-run only when the incoming text chunk changes
  useEffect(() => {
    setShouldHighlight(false);
    triggerHighlight();
    return () => {
      triggerHighlight.cancel();
    };
  }, [token.text, triggerHighlight]);

  const codeElement = useMemo(() => {
    if (!shouldHighlight || pendingHighlight) {
      return (
        <code className="block whitespace-pre-wrap text-gray-800 bg-gray-100 rounded px-4 py-2 font-mono text-sm">
          {token.text}
        </code>
      );
    }
    return (
      <SyntaxHighlighter
        language={highlightedLang}
        style={oneLight}
        customStyle={{ color: "#111827", fontSize: "14px" }}
      >
        {token.text}
      </SyntaxHighlighter>
    );
  }, [shouldHighlight, pendingHighlight, highlightedLang, token.text]);

  async function copyText() {
    setIsChecked(await copyToClipboard(token.text));
    setTimeout(() => setIsChecked(false), 3000);
  }

  return (
    <div
      key={randomKey()}
      className="my-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow"
    >
      <div className="flex justify-between border-b border-gray-200 px-2 py-2 bg-gray-50">
        <div className="flex gap-x-1 items-center">
          {token.lang && (
            <Icon
              icon={langIcon(highlightedLang)}
              className="h-4 w-4 bg-transparent"
            />
          )}
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
                : "lucide--copy text-gray-400"
            )}
          />
        </button>
      </div>
      <pre className="*:!m-0 bg-white">{codeElement}</pre>
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
      className="cursor-pointer rounded bg-gray-100 px-1 py-[0.5px] text-gray-800 text-base"
    >
      {token.text}
    </code>
  );
}

function ParagraphBlock({ token }: { token: Tokens.Paragraph }) {
  if (!token.tokens) {
    return (
      <p key={randomKey()}>
        <span className="text-gray-800 text-base">{token.text}</span>
      </p>
    );
  }
  return (
    <p key={randomKey()}>
      {token.tokens.map((t, i) => (
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
        <span className="pr-1 text-gray-500 text-base">{number}.</span>
      )}
      {(token.tokens ?? []).map((t, i) => (
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
    <ul key={randomKey()} className="list-disc pl-3 text-gray-500 text-base">
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
          <h1
            key={randomKey()}
            className="px-3 py-1 text-3xl font-bold"
          >
            {token.text}
          </h1>
        );
      case 2:
        return (
          <h2
            key={randomKey()}
            className="px-3 py-1 text-2xl font-semibold"
          >
            {token.text}
          </h2>
        );
      case 3:
        return (
          <h3
            key={randomKey()}
            className="px-3 py-1 text-xl font-semibold"
          >
            {token.text}
          </h3>
        );
      case 4:
        return (
          <h4
            key={randomKey()}
            className="px-3 py-1 text-lg font-medium"
          >
            {token.text}
          </h4>
        );
      case 5:
        return (
          <h5
            key={randomKey()}
            className="px-3 py-1 text-base font-medium"
          >
            {token.text}
          </h5>
        );
      case 6:
        return (
          <h6
            key={randomKey()}
            className="px-3 py-1 text-sm font-medium"
          >
            {token.text}
          </h6>
        );
    }
  }
  switch (depth) {
    case 1:
      return (
        <h1
          key={randomKey()}
          className="px-3 py-1 text-3xl font-bold"
        >
          {token.tokens.map((t, i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h1>
      );
    case 2:
      return (
        <h2
          key={randomKey()}
          className="px-3 py-1 text-2xl font-semibold"
        >
          {token.tokens.map((t, i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h2>
      );
    case 3:
      return (
        <h3
          key={randomKey()}
          className="px-3 py-1 text-xl font-semibold"
        >
          {token.tokens.map((t, i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h3>
      );
    case 4:
      return (
        <h4
          key={randomKey()}
          className="px-3 py-1 text-lg font-medium"
        >
          -900 shadow {token.tokens.map((t, i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h4>
      );
    case 5:
      return (
        <h5
          key={randomKey()}
          className="px-3 py-1 text-base font-medium"
        >
          {token.tokens.map((t, i) => (
            <TokenBlock key={randomKey()} token={t} />
          ))}
        </h5>
      );
    case 6:
      return (
        <h6
          key={randomKey()}
          className="px-3 py-1 text-sm font-medium"
        >
          {token.tokens.map((t, i) => (
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
      className="text-blue-500 hover:underline after:content-['↗'] after:ml-1"
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
    <blockquote key={randomKey()} className="border-l-4 border-gray-300 pl-4">
      {token.text}
    </blockquote>
  );
}

function DelBlock({ token }: { token: Tokens.Del }) {
  return (
    <del key={randomKey()} className="text-gray-500 text-base">
      {token.text}
    </del>
  );
}

function EmBlock({ token }: { token: Tokens.Em }) {
  if (!token.tokens) {
    return (
      <em key={randomKey()} className="text-gray-500 text-base">
        {token.text}
      </em>
    );
  }
  return (
    <em key={randomKey()} className="text-gray-500">
      {token.tokens.map((t, i) => (
        <TokenBlock key={randomKey()} token={t} />
      ))}
    </em>
  );
}

function EscapeBlock({ token }: { token: Tokens.Escape }) {
  return (
    <span key={randomKey()} className="text-gray-500 text-base">
      {token.text}
    </span>
  );
}

function BrBlock({ token }: { token: Tokens.Br }) {
  return <br key={randomKey()} />;
}

function HrBlock({ token }: { token: Tokens.Hr }) {
  return <hr key={randomKey()} />;
}

function TableBlock({ token }: { token: Tokens.Table }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-gray-200 bg-white text-sm text-left">
        <thead className="bg-gray-50">
          <tr>
            {token.header.map((cell) => (
              <th
                key={randomKey()}
                className={`px-4 py-2 border-b border-gray-200 font-semibold text-gray-900 ${cell.align ? ` text-${cell.align}` : ""}`}
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
            <tr key={randomKey()} className="even:bg-gray-50">
              {row.map((cell) => (
                <td
                  key={randomKey()}
                  className={`px-4 py-2 border-b border-gray-200 text-gray-800${cell.align ? ` text-${cell.align}` : ""}`}
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
