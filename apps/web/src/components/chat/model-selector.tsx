import { Check, ChevronDown } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { usePersisted } from "~/hooks/use-persisted";
import { getDefaultModel, models } from "~/lib/models";
import { cn } from "~/lib/utils";

export const MODEL_PERSIST_KEY = "selected-model";

const ModelSelector = memo(function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { value: selectedModelId, set: setSelectedModelId } =
    usePersisted<number>(MODEL_PERSIST_KEY, getDefaultModel().id);

  const selectedModel =
    models.find((m) => m.id === selectedModelId) || getDefaultModel();

  const handleModelSelect = useCallback(
    (modelId: number) => {
      setSelectedModelId(modelId);
      setIsOpen(false);
    },
    [setSelectedModelId],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 justify-between gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
        >
          <span>{selectedModel.name}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <div className="flex flex-col gap-0.5">
          {models.map((model) => (
            <Button
              key={model.id}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 justify-between px-2 text-xs hover:bg-accent hover:text-accent-foreground",
                selectedModelId === model.id && "bg-accent",
              )}
              onClick={() => handleModelSelect(model.id)}
            >
              <span>{model.name}</span>
              {selectedModelId === model.id && <Check className="h-3 w-3" />}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
});

export { ModelSelector };
