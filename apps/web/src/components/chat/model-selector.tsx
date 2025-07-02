import { memo, useState } from "react";
import { Icon } from "@iconify/react";
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
import { usePersisted } from "~/hooks/use-persisted";
import { getCompanyIcon, getDefaultModel, models } from "~/lib/models";
import { AnimatedShinyText } from "~/components/ui/animated-shiny-text";
import { Sparkles, Gem, ChevronDown, Check } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export const MODEL_PERSIST_KEY = "selected-model";

const ModelSelector = memo(function ModelSelector() {
  const { value: selectedModelId, set: setSelectedModelId } =
    usePersisted<number>(MODEL_PERSIST_KEY, getDefaultModel().id);

  const [open, setOpen] = useState(false);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const renderModelContent = (model: (typeof models)[number]) => {
    const iconName = getCompanyIcon(model);

    const nameElement = model.recentlyUpdated ? (
      <AnimatedShinyText shimmerWidth={100}>{model.name}</AnimatedShinyText>
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
          className="h-8 justify-between gap-1 px-2 text-muted-foreground text-xs hover:text-foreground w-fit bg-transparent dark:bg-transparent border-none shadow-none"
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
          <CommandInput placeholder="Search model..." className="h-9" />
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
                      selectedModelId === model.id ? "opacity-100" : "opacity-0"
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
