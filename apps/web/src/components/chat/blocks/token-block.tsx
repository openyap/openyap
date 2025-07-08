// Main token block component that routes to specific block components

import type { Token, Tokens } from "marked";
import { MemoizedCodeBlock } from "~/components/chat/blocks/code-block";
import { ImageBlock } from "~/components/chat/blocks/image-block";
import { LinkBlock } from "~/components/chat/blocks/link-block";
import { ListBlock } from "~/components/chat/blocks/list-block";
import { ParagraphBlock } from "~/components/chat/blocks/paragraph-block";
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
} from "~/components/chat/blocks/simple-blocks";
import { TableBlock } from "~/components/chat/blocks/table-block";

type TokenBlockProps = {
  token: Token;
};

export function TokenBlock({ token }: TokenBlockProps) {
  switch (token.type) {
    case "blockquote":
      return <BlockquoteBlock token={token as Tokens.Blockquote} />;
    case "br":
      return <BrBlock token={token as Tokens.Br} />;
    case "code":
      return <MemoizedCodeBlock token={token as Tokens.Code} />;
    case "codespan":
      return <CodeSpanBlock token={token as Tokens.Codespan} />;
    case "del":
      return <DelBlock token={token as Tokens.Del} />;
    case "em":
      return <EmBlock token={token as Tokens.Em} />;
    case "escape":
      return <EscapeBlock token={token as Tokens.Escape} />;
    case "heading":
      return <HeadingBlock token={token as Tokens.Heading} />;
    case "hr":
      return <HrBlock token={token as Tokens.Hr} />;
    case "image":
      return <ImageBlock token={token as Tokens.Image} />;
    case "link":
      return <LinkBlock token={token as Tokens.Link} />;
    case "list":
      return <ListBlock token={token as Tokens.List} />;
    case "paragraph":
      return <ParagraphBlock token={token as Tokens.Paragraph} />;
    case "strong":
      return <StrongBlock token={token as Tokens.Strong} />;
    case "table":
      return <TableBlock token={token as Tokens.Table} />;
    case "text":
      return <TextBlock token={token as Tokens.Text} />;
    default:
      return <span className="text-foreground">{token.raw}</span>;
  }
}
