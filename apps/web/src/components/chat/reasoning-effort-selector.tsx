import { memo, useCallback } from "react";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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

export const REASONING_EFFORT_PERSIST_KEY = "selected-reasoning-effort";

const effortOptions: EffortLabel[] = [
  ReasoningEffort.LOW,
  ReasoningEffort.MEDIUM,
  ReasoningEffort.HIGH,
];

const ReasoningEffortSelector = memo(function ReasoningEffortSelector() {
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

  const handleEffortChange = useCallback(
    (value: string) => {
      setSelectedEffort(value as EffortLabel);
    },
    [setSelectedEffort],
  );

  if (!selectedModel || !selectedModel.reasoningEffort) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Select value={selectedEffort} onValueChange={handleEffortChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Effort" />
          </SelectTrigger>
          <SelectContent>
            {effortOptions.map((effort) => (
              <SelectItem key={effort} value={effort}>
                {effort}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TooltipTrigger>
      <TooltipContent>Reasoning effort</TooltipContent>
    </Tooltip>
  );
});

export { ReasoningEffortSelector };
