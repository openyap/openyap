// Main token block component that routes to specific block components

import type { Token, Tokens } from "marked";
import { MemoizedCodeBlock } from "./code-block";
import { ImageBlock } from "./image-block";
import { LinkBlock } from "./link-block";
import { ListBlock } from "./list-block";
import { ParagraphBlock } from "./paragraph-block";
import {
  BlockquoteBlock,
  BrBlock,
  CodeSpanBlock,
  DelBlock,
  EmBlock,
  EscapeBlock,
  HeadingBlock,
  HrBlock,
  StrongBlock,
  TextBlock,
} from "./simple-blocks";
import { TableBlock } from "./table-block";

function randomKey() {
  return crypto.randomUUID();
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
        <span key={randomKey()} className="text-foreground">
          {token.raw}
        </span>
      );
  }
}
