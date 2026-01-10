import { useQueryState, parseAsString, parseAsStringEnum } from 'nuqs'

export const taskStatusParser = parseAsStringEnum(['all', 'todo', 'in_progress', 'done', 'blocked'])

export function useTaskSearchParams() {
  const [taskId, setTaskId] = useQueryState('task', parseAsString)
  const [filter, setFilter] = useQueryState('filter', taskStatusParser.withDefault('all'))

  return {
    taskId,
    setTaskId,
    filter,
    setFilter
  }
}
