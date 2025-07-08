import type { Tokens } from "marked";
import { TokenBlock } from "~/components/chat/blocks/token-block";
import { getTokenKey } from "~/lib/utils";

type ListItemBlockProps = {
  token: Tokens.ListItem;
};

function ListItemBlock({ token }: ListItemBlockProps) {
  const isTaskItem = token.task;
  const isChecked = token.checked;
  const isLoose = token.loose;

  return (
    <li className={`flex items-start gap-2 ${isLoose ? "my-2" : "my-1"}`}>
      {isTaskItem && (
        <input
          type="checkbox"
          checked={isChecked}
          disabled
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      )}
      <div className="min-w-0 flex-1">
        {token.tokens.map((subToken, index) => (
          <TokenBlock key={getTokenKey(subToken, index)} token={subToken} />
        ))}
      </div>
    </li>
  );
}

type ListBlockProps = {
  token: Tokens.List;
};

export function ListBlock({ token }: ListBlockProps) {
  const ListTag = token.ordered ? "ol" : "ul";
  const isLoose = token.loose;
  const hasTaskItems = token.items.some((item) => item.task);

  const className = token.ordered
    ? `my-1 list-decimal ${hasTaskItems ? "" : "list-inside"} ${isLoose ? "space-y-2" : "space-y-1"}`
    : `my-1 list-disc ${hasTaskItems ? "" : "list-inside"} ${isLoose ? "space-y-2" : "space-y-1"}`;

  return (
    <ListTag
      className={className}
      {...(token.ordered &&
        token.start &&
        token.start !== 1 && { start: token.start })}
    >
      {token.items.map((item, index) => (
        <ListItemBlock key={getTokenKey(item, index)} token={item} />
      ))}
    </ListTag>
  );
}
