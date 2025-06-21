import { memo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { models } from "~/lib/models";

interface ModelSelectorProps {
  selectedModelId: number;
  onModelChange: (modelId: number) => void;
}

const ModelSelector = memo(function ModelSelector({
  selectedModelId,
  onModelChange,
}: ModelSelectorProps) {
  const handleModelChange = useCallback(
    (value: string) => {
      onModelChange(Number.parseInt(value));
    },
    [onModelChange]
  );

  return (
    <div className="flex justify-start">
      <Select
        value={selectedModelId.toString()}
        onValueChange={handleModelChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id.toString()}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

export { ModelSelector, type ModelSelectorProps };
