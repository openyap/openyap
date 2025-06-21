import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Updater<T> = T | ((prev: T) => T);

interface PersistedState<T> {
  value: T;
  set: (value: Updater<T>) => void;
  reset: () => void;
}

type PersistedStore<T> = {
  (): PersistedState<T>;
  <U>(selector: (state: PersistedState<T>) => U): U;
};

const stores: Record<string, PersistedStore<unknown>> = {};

function createStore<T>(key: string, defaultValue: T): PersistedStore<T> {
  return create<PersistedState<T>>()(
    persist(
      (set, get) => ({
        value: defaultValue,
        set: (v: Updater<T>) =>
          set({
            value:
              typeof v === "function" ? (v as (prev: T) => T)(get().value) : v,
          }),
        reset: () => set({ value: defaultValue }),
      }),
      {
        name: `local:${key}`,
        storage: createJSONStorage(() => localStorage),
      }
    )
  ) as unknown as PersistedStore<T>;
}

/**
 * A tiny helper to persist arbitrary client-side state in localStorage using Zustand.
 *
 * Each call to `usePersisted` is isolated: the value is stored under a unique
 * `local:${key}` entry and exposed through its own lazily-created store.  This
 * keeps different pieces of state independent while sharing the same helper.
 *
 * Strongly-typed generics ensure you always get back the correct type without
 * unsafe casts.
 *
 * @template T
 * @param {string} key Unique identifier for this piece of persisted state.
 * @param {T} defaultValue Fallback value when nothing is stored yet.
 * @returns An object containing:
 *  - `value`: the current value.
 *  - `set`:   a setter accepting either a new value or `(prev) => next`.
 *  - `reset`: resets back to `defaultValue`.
 *
 * @example
 * // simple string preference
 * const { value: theme, set: setTheme } = usePersisted('theme', 'light');
 *
 * @example
 * // complex object with functional updater
 * type Filters = { search: string; showArchived: boolean };
 * const {
 *   value: filters,
 *   set: setFilters,
 *   reset,
 * } = usePersisted<Filters>('filters', { search: '', showArchived: false });
 *
 * // toggle a field
 * setFilters((prev) => ({ ...prev, showArchived: !prev.showArchived }));
 */
export function usePersisted<T>(key: string, defaultValue: T) {
  if (!stores[key]) {
    stores[key] = createStore(key, defaultValue) as PersistedStore<unknown>;
  }
  const store = stores[key] as PersistedStore<T>;
  return {
    value: store((s) => s.value),
    set: store((s) => s.set),
    reset: store((s) => s.reset),
  } as const;
}
