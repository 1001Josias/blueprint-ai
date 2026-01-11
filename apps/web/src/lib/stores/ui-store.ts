import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type SidebarFilter = 'all' | 'active' | 'archived'

interface UIStore {
  // Sidebar state
  collapsedWorkspaces: Record<string, boolean>
  sidebarStatusFilter: SidebarFilter

  // Actions
  toggleWorkspace: (workspace: string) => void
  setSidebarFilter: (filter: SidebarFilter) => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        collapsedWorkspaces: {},
        sidebarStatusFilter: 'all',

        toggleWorkspace: (workspace) =>
          set(
            (state) => ({
              collapsedWorkspaces: {
                ...state.collapsedWorkspaces,
                [workspace]: !state.collapsedWorkspaces[workspace],
              },
            }),
            undefined,
            'ui/toggleWorkspace'
          ),

        setSidebarFilter: (filter) =>
          set(
            { sidebarStatusFilter: filter },
            undefined,
            'ui/setSidebarFilter'
          ),
      }),
      { name: 'ui-store' }
    ),
    { name: 'UIStore' }
  )
)
