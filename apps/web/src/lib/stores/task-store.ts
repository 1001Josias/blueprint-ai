import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { TaskStatus, Subtask } from '@/lib/schemas'

interface TaskStore {
  // Optimistic state cache per task
  optimisticStatus: Record<string, TaskStatus>
  optimisticSubtasks: Record<string, Subtask[]>
  pendingTasks: Set<string>

  // Actions
  setOptimisticStatus: (taskId: string, status: TaskStatus) => void
  setOptimisticSubtasks: (taskId: string, subtasks: Subtask[]) => void
  clearOptimistic: (taskId: string) => void
  setPending: (taskId: string, pending: boolean) => void
  
  // Selectors
  getStatus: (taskId: string, fallback: TaskStatus) => TaskStatus
  getSubtasks: (taskId: string, fallback: Subtask[]) => Subtask[]
  isPending: (taskId: string) => boolean
}

export const useTaskStore = create<TaskStore>()(
  devtools(
    (set, get) => ({
      optimisticStatus: {},
      optimisticSubtasks: {},
      pendingTasks: new Set(),

      setOptimisticStatus: (taskId, status) =>
        set(
          (state) => ({
            optimisticStatus: { ...state.optimisticStatus, [taskId]: status },
          }),
          undefined,
          'task/setOptimisticStatus'
        ),

      setOptimisticSubtasks: (taskId, subtasks) =>
        set(
          (state) => ({
            optimisticSubtasks: { ...state.optimisticSubtasks, [taskId]: subtasks },
          }),
          undefined,
          'task/setOptimisticSubtasks'
        ),

      clearOptimistic: (taskId) =>
        set(
          (state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [taskId]: _status, ...restStatus } = state.optimisticStatus
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [taskId]: _subtasks, ...restSubtasks } = state.optimisticSubtasks
            return {
              optimisticStatus: restStatus,
              optimisticSubtasks: restSubtasks,
            }
          },
          undefined,
          'task/clearOptimistic'
        ),

      setPending: (taskId, pending) =>
        set(
          (state) => {
            const newPendingTasks = new Set(state.pendingTasks)
            if (pending) {
              newPendingTasks.add(taskId)
            } else {
              newPendingTasks.delete(taskId)
            }
            return { pendingTasks: newPendingTasks }
          },
          undefined,
          'task/setPending'
        ),

      // Selectors
      getStatus: (taskId, fallback) => {
        const state = get()
        return state.optimisticStatus[taskId] ?? fallback
      },

      getSubtasks: (taskId, fallback) => {
        const state = get()
        return state.optimisticSubtasks[taskId] ?? fallback
      },

      isPending: (taskId) => {
        const state = get()
        return state.pendingTasks.has(taskId)
      },
    }),
    { name: 'TaskStore' }
  )
)
