import { memo, useCallback } from "react";
import { Icon } from "@iconify/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { usePersisted } from "~/hooks/use-persisted";
import { getCompanyIcon, getDefaultModel, models } from "~/lib/models";

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
      <SelectTrigger className="w-fit bg-transparent dark:bg-transparent border-none shadow-none">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => {
          const iconName = getCompanyIcon(model);
          return (
            <SelectItem key={model.id} value={model.id.toString()}>
              {iconName ? (
                <span className="flex items-center gap-2">
                  <Icon icon={iconName} className="size-4 bg-transparent" />
                  {model.name}
                </span>
              ) : (
                model.name
              )}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
});

export { ModelSelector };
