import { Globe } from "lucide-react";
import { memo, useCallback } from "react";
import { Toggle } from "~/components/ui/toggle";
import { usePersisted } from "~/hooks/use-persisted";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const SEARCH_TOGGLE_KEY = "search-toggle";

const ChatToggles = memo(function ChatToggles() {
  const { value: searchEnabled, set: setSearchEnabled } = usePersisted<boolean>(
    SEARCH_TOGGLE_KEY,
    false,
  );

  const handleToggle = useCallback(
    (pressed: boolean) => {
      setSearchEnabled(pressed);
    },
    [setSearchEnabled],
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          variant="outline"
          size="sm"
          className={cn(
            "h-8 w-8 cursor-pointer border-none p-0",
            searchEnabled
              ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary data-[state=on]:bg-primary/10"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
          pressed={searchEnabled}
          onPressedChange={handleToggle}
        >
          <Globe className="h-4 w-4" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        <p>Search {searchEnabled ? "enabled" : "disabled"}</p>
      </TooltipContent>
    </Tooltip>
  );
});

export { ChatToggles };
