import { memo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { usePersisted } from "~/hooks/use-persisted";
import { getDefaultModel, models } from "~/lib/models";

export const MODEL_PERSIST_KEY = "selected-model";

const ModelSelector = memo(function ModelSelector() {
  const { value: selectedModelId, set: setSelectedModelId } =
    usePersisted<number>(MODEL_PERSIST_KEY, getDefaultModel().id);

  const handleModelChange = useCallback(
    (value: string) => {
      setSelectedModelId(Number.parseInt(value));
    },
    [setSelectedModelId]
  );

  return (
    <Select
      value={selectedModelId.toString()}
      onValueChange={handleModelChange}
    >
      <SelectTrigger className="w-fit">
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
  );
});

export { ModelSelector };
