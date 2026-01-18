import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs";

export const taskStatusParser = parseAsStringEnum([
  "all",
  "todo",
  "in_progress",
  "done",
  "blocked",
]);

/**
 * Hook for managing task-related URL search params (taskId and filter)
 */
export function useTaskSearchParams() {
  const [taskId, setTaskId] = useQueryState("task", parseAsString);
  const [filter, setFilter] = useQueryState(
    "filter",
    taskStatusParser.withDefault("all"),
  );

  return {
    taskId,
    setTaskId,
    filter,
    setFilter,
  };
}

/**
 * Simple hook for managing just the taskId URL param.
 * Returns a tuple [taskId, setTaskId] for consistency with useState pattern.
 */
export function useTaskIdParam() {
  const [taskId, setTaskId] = useQueryState("task", parseAsString);
  return [taskId, setTaskId] as const;
}

/**
 * Generic hook for managing tab selection via URL search params.
 * Supports shareable and bookmarkable URLs with tab state.
 *
 * @param validTabs - Array of valid tab values
 * @param defaultTab - Default tab to use when no tab is specified in URL
 * @param paramName - URL param name (defaults to 'tab')
 *
 * @example
 * // In a component with tabs
 * const { tab, setTab } = useTabParam(['overview', 'details', 'history'], 'overview')
 */
export function useTabParam<T extends string>(
  validTabs: readonly T[],
  defaultTab: T,
  paramName: string = "tab",
) {
  const tabParser = parseAsStringEnum(validTabs as unknown as string[]);
  const [tab, setTab] = useQueryState(
    paramName,
    tabParser.withDefault(defaultTab as string),
  );

  return {
    tab: tab as T,
    setTab: setTab as (value: T | null) => Promise<URLSearchParams>,
  };
}
