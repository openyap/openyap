import { Icon } from "@iconify/react";
import { memo, useCallback } from "react";
import { Toggle } from "~/components/ui/toggle";
import { usePersisted } from "~/hooks/use-persisted";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const SEARCH_TOGGLE_KEY = "search-toggle";

const ChatToggles = memo(function ChatToggles() {
  const { value: searchEnabled, set: setSearchEnabled } = usePersisted<boolean>(
    SEARCH_TOGGLE_KEY,
    false
  );

  const handleToggle = useCallback(
    (pressed: boolean) => {
      setSearchEnabled(pressed);
    },
    [setSearchEnabled]
  );

  return (
    <Tooltip>
      <TooltipTrigger className="hover:cursor-pointer">
        <Toggle
          className="bg-transparent dark:bg-transparent border-none shadow-none"
          variant="outline"
          size="default"
          pressed={searchEnabled}
          onPressedChange={handleToggle}
          asChild
        >
          <Icon icon="lucide:globe" className="bg-transparent" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        <p>Search</p>
      </TooltipContent>
    </Tooltip>
  );
});

export { ChatToggles };
