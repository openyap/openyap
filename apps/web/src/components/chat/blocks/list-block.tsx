import type { Tokens } from "marked";
import { TokenBlock } from "~/components/chat/blocks/token-block";
import { getTokenKey } from "~/lib/utils";

type ListItemBlockProps = {
  token: Tokens.ListItem;
};

function ListItemBlock({ token }: ListItemBlockProps) {
  return (
    <li className="my-1">
      {token.tokens.map((subToken, index) => (
        <TokenBlock key={getTokenKey(subToken, index)} token={subToken} />
      ))}
    </li>
  );
}

type ListBlockProps = {
  token: Tokens.List;
};

export function ListBlock({ token }: ListBlockProps) {
  const ListTag = token.ordered ? "ol" : "ul";
  const className = token.ordered
    ? "my-4 list-decimal list-inside space-y-1"
    : "my-4 list-disc list-inside space-y-1";

  return (
    <ListTag className={className}>
      {token.items.map((item, index) => (
        <ListItemBlock key={getTokenKey(item, index)} token={item} />
      ))}
    </ListTag>
  );
}
