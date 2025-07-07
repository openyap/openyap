import { Check, ChevronDown } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { usePersisted } from "~/hooks/use-persisted";
import {
  type EffortLabel,
  ReasoningEffort,
  getDefaultModel,
  getModelById,
} from "~/lib/models";
import { cn } from "~/lib/utils";

export const REASONING_EFFORT_PERSIST_KEY = "selected-reasoning-effort";

const effortOptions: EffortLabel[] = [
  ReasoningEffort.LOW,
  ReasoningEffort.MEDIUM,
  ReasoningEffort.HIGH,
];

const ReasoningEffortSelector = memo(function ReasoningEffortSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { value: selectedModelId } = usePersisted<number>(
    MODEL_PERSIST_KEY,
    getDefaultModel().id,
  );
  const { value: selectedEffort, set: setSelectedEffort } =
    usePersisted<EffortLabel>(
      REASONING_EFFORT_PERSIST_KEY,
      ReasoningEffort.LOW,
    );

  const selectedModel = getModelById(selectedModelId);

  const handleEffortSelect = useCallback(
    (effort: EffortLabel) => {
      setSelectedEffort(effort);
      setIsOpen(false);
    },
    [setSelectedEffort],
  );

  if (!selectedModel || !selectedModel.reasoningEffort) return null;

  return (
    <Tooltip>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 justify-between gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
            >
              <span>
                {selectedEffort.charAt(0).toUpperCase() +
                  selectedEffort.slice(1)}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40 p-1">
          <div className="flex flex-col gap-0.5">
            {effortOptions.map((effort) => (
              <Button
                key={effort}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 justify-between px-2 text-xs hover:bg-accent hover:text-accent-foreground",
                  selectedEffort === effort && "bg-accent",
                )}
                onClick={() => handleEffortSelect(effort)}
              >
                <span>{effort.charAt(0).toUpperCase() + effort.slice(1)}</span>
                {selectedEffort === effort && <Check className="h-3 w-3" />}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent>Reasoning effort</TooltipContent>
    </Tooltip>
  );
});

export { ReasoningEffortSelector };
