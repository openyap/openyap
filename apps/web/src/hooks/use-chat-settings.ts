import { SEARCH_TOGGLE_KEY } from "~/components/chat/chat-toggles";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { REASONING_EFFORT_PERSIST_KEY } from "~/components/chat/reasoning-effort-selector";
import { usePersisted } from "~/hooks/use-persisted";
import {
  type EffortLabel,
  ReasoningEffort,
  getDefaultModel,
} from "~/lib/models";

export function useChatSettings() {
  const { value: selectedModelId, set: setSelectedModelId } =
    usePersisted<number>(MODEL_PERSIST_KEY, getDefaultModel().id);
  const {
    value: searchEnabled,
    set: setSearchEnabled,
    reset: resetSearchToggle,
  } = usePersisted<boolean>(SEARCH_TOGGLE_KEY, false);
  const { value: reasoningEffort } = usePersisted<EffortLabel>(
    REASONING_EFFORT_PERSIST_KEY,
    ReasoningEffort.LOW,
  );

  return {
    selectedModelId,
    setSelectedModelId,
    searchEnabled,
    setSearchEnabled,
    resetSearchToggle,
    reasoningEffort,
  } as const;
}
