// Simple token block components that don't require their own files

import type { Tokens } from "marked";
import { createElement } from "react";
import { TokenBlock } from "./token-block";

type BlockquoteBlockProps = {
  token: Tokens.Blockquote;
};

export function BlockquoteBlock({ token }: BlockquoteBlockProps) {
  return (
    <blockquote className="my-4 border-primary border-l-4 pl-4 text-muted-foreground italic">
      {token.tokens.map((subToken) => (
        <TokenBlock key={subToken.raw} token={subToken} />
      ))}
    </blockquote>
  );
}

type BrBlockProps = {
  token: Tokens.Br;
};

export function BrBlock({ token: _token }: BrBlockProps) {
  return <br />;
}

type CodeSpanBlockProps = {
  token: Tokens.Codespan;
};

export function CodeSpanBlock({ token }: CodeSpanBlockProps) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
      {token.text}
    </code>
  );
}

type DelBlockProps = {
  token: Tokens.Del;
};

export function DelBlock({ token }: DelBlockProps) {
  return (
    <del>
      {token.tokens.map((subToken) => (
        <TokenBlock key={subToken.raw} token={subToken} />
      ))}
    </del>
  );
}

type EmBlockProps = {
  token: Tokens.Em;
};

export function EmBlock({ token }: EmBlockProps) {
  return (
    <em>
      {token.tokens.map((subToken) => (
        <TokenBlock key={subToken.raw} token={subToken} />
      ))}
    </em>
  );
}

type EscapeBlockProps = {
  token: Tokens.Escape;
};

export function EscapeBlock({ token }: EscapeBlockProps) {
  return <span>{token.text}</span>;
}

type HeadingBlockProps = {
  token: Tokens.Heading;
};

export function HeadingBlock({ token }: HeadingBlockProps) {
  const headingTag = `h${token.depth}`;

  const className =
    {
      1: "mb-4 mt-6 text-2xl font-bold text-foreground",
      2: "mb-3 mt-5 text-xl font-semibold text-foreground",
      3: "mb-2 mt-4 text-lg font-semibold text-foreground",
      4: "mb-2 mt-3 text-base font-medium text-foreground",
      5: "mb-1 mt-2 text-sm font-medium text-foreground",
      6: "mb-1 mt-2 text-xs font-medium text-foreground",
    }[token.depth] || "mb-2 mt-3 text-base font-medium text-foreground";

  return createElement(
    headingTag,
    { className },
    token.tokens.map((subToken) => (
      <TokenBlock key={subToken.raw} token={subToken} />
    )),
  );
}

type HrBlockProps = {
  token: Tokens.Hr;
};

export function HrBlock({ token: _token }: HrBlockProps) {
  return <hr className="my-6 border-border" />;
}

type StrongBlockProps = {
  token: Tokens.Strong;
};

export function StrongBlock({ token }: StrongBlockProps) {
  return (
    <strong>
      {token.tokens.map((subToken) => (
        <TokenBlock key={subToken.raw} token={subToken} />
      ))}
    </strong>
  );
}

type TextBlockProps = {
  token: Tokens.Text;
};

export function TextBlock({ token }: TextBlockProps) {
  return <span className="text-foreground">{token.text}</span>;
}
