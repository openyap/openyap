import { memo, useCallback } from "react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Icon } from "@iconify/react";
import { usePersisted } from "~/hooks/usePersisted";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export interface ToggleState {
  search: boolean;
}

const ChatToggles = memo(function ChatToggles() {
  const { value: toggles, set: setToggles } = usePersisted<ToggleState>(
    "chat-toggle-options",
    { search: false }
  );

  const groupValue = toggles.search ? ["search"] : [];

  const handleChange = useCallback(
    (values: string[]) => {
      setToggles((prev) => ({ ...prev, search: values.includes("search") }));
    },
    [setToggles]
  );

  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      value={groupValue}
      onValueChange={handleChange}
    >
      <Tooltip>
        <TooltipTrigger>
          <ToggleGroupItem value="search" size="default">
            <Icon icon="lucide:globe" className="bg-transparent" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>
          <p>Search</p>
        </TooltipContent>
      </Tooltip>
    </ToggleGroup>
  );
});

export { ChatToggles };
