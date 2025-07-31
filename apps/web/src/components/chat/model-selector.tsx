import { Icon } from "@iconify/react";
import { Check, ChevronDown, Gem, Sparkles } from "lucide-react";
import { memo, useState } from "react";
import { AnimatedShinyText } from "~/components/ui/animated-shiny-text";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
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
import { STORAGE_KEYS, UI_CONSTANTS } from "~/lib/constants";
import { getCompanyIcon, getDefaultModel, models } from "~/lib/models";
import { cn } from "~/lib/utils";

export const MODEL_PERSIST_KEY = STORAGE_KEYS.MODEL_SELECTION;

const ModelSelector = memo(function ModelSelector() {
  const { value: selectedModelId, set: setSelectedModelId } =
    usePersisted<number>(MODEL_PERSIST_KEY, getDefaultModel().id);

  const [open, setOpen] = useState(false);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const renderModelContent = (model: (typeof models)[number]) => {
    const iconName = getCompanyIcon(model);

    const nameElement = model.recentlyUpdated ? (
      <AnimatedShinyText shimmerWidth={UI_CONSTANTS.TITLE_LIMITS.MAX_LENGTH}>
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

    return iconName ? (
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
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-fit justify-between gap-1 border-none bg-transparent px-2 text-muted-foreground text-xs shadow-none hover:text-foreground dark:bg-transparent"
        >
          {selectedModel ? renderModelContent(selectedModel) : "Select model"}
          <ChevronDown className="ml-2 h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command
          filter={(value, search, keywords) => {
            const haystack = [...(keywords ?? []), value]
              .join(" ")
              .toLowerCase();
            const needle = search.toLowerCase();
            return haystack.includes(needle) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder="Search model..."
            className="h-9 rounded-none"
          />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id.toString()}
                  keywords={[model.company, model.name]}
                  onSelect={(currentValue) => {
                    setSelectedModelId(Number.parseInt(currentValue));
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {renderModelContent(model)}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      selectedModelId === model.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export { ModelSelector };
