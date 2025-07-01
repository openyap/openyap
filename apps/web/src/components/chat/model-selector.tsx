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
import { AnimatedShinyText } from "~/components/ui/animated-shiny-text";
import { Sparkles, Gem } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";

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
          const nameElement = model.recentlyUpdated ? (
            <AnimatedShinyText shimmerWidth={100}>
              {model.name}
            </AnimatedShinyText>
          ) : (
            model.name
          );

          const premiumGem = model.premium ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="pointer-events-auto">
                  <Gem className="size-3 text-sky-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">Premium model</TooltipContent>
            </Tooltip>
          ) : null;

          const updatedSparkles = model.recentlyUpdated ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="pointer-events-auto">
                  <Sparkles className="size-3 text-orange-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">Recently updated</TooltipContent>
            </Tooltip>
          ) : null;

          const content = iconName ? (
            <span className="flex items-center gap-2">
              <Icon icon={iconName} className="size-4 bg-transparent" />
              {nameElement}
              {premiumGem}
              {updatedSparkles}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {nameElement}
              {premiumGem}
              {updatedSparkles}
            </span>
          );

          return (
            <SelectItem key={model.id} value={model.id.toString()}>
              {content}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
});

export { ModelSelector };
