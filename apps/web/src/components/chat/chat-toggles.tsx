import { Icon } from "@iconify/react";
import { memo, useCallback } from "react";
import { Toggle } from "~/components/ui/toggle";
import { usePersisted } from "~/hooks/usePersisted";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const ChatToggles = memo(function ChatToggles() {
  const { value: searchEnabled, set: setSearchEnabled } = usePersisted<boolean>(
    "search-toggle",
    false
  );

  const handleToggle = useCallback(
    (pressed: boolean) => {
      console.log("[ChatToggles] handleToggle", pressed);
      setSearchEnabled(pressed);
    },
    [setSearchEnabled]
  );

  return (
    <Tooltip>
      <TooltipTrigger>
        <Toggle
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
