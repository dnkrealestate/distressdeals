import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import type { Project } from '@/types'
import { useCompareStore } from '@/store/compareStore'
import { warnCompareConflict, READY_VS_PROJECT, OFFPLAN_VS_PROJECT } from '@/components/buyer/compareConflict'

// Off-plan projects compare side by side on /projects/compare (their own fields: developer, handover, payment plan…),
// separately from the property compare. Kept in the browser so it works without signing in.
export const MAX_PROJECT_COMPARE = 3

interface ProjectCompareState {
  projects: Project[]
  toggle: (project: Project) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
}

export const useProjectCompareStore = create<ProjectCompareState>()(
  persist(
    (set, get) => ({
      projects: [],
      toggle: (project) => {
        const list = get().projects
        if (list.some(p => p._id === project._id)) { set({ projects: list.filter(p => p._id !== project._id) }); return }
        // Properties already being compared live in the other (property) comparison — warn instead of mixing.
        const props = useCompareStore.getState().compareList
        if (props.length) {
          const hasReady = props.some(p => p.completion !== 'off_plan')
          warnCompareConflict(hasReady ? READY_VS_PROJECT : OFFPLAN_VS_PROJECT, () => {
            useCompareStore.getState().clearCompare()
            set({ projects: [project] })
            toast.success('Added to compare')
          })
          return
        }
        if (list.length >= MAX_PROJECT_COMPARE) { toast.error(`You can compare up to ${MAX_PROJECT_COMPARE} projects`); return }
        set({ projects: [...list, project] })
        toast.success('Added to compare')
      },
      remove: (id) => set({ projects: get().projects.filter(p => p._id !== id) }),
      clear: () => set({ projects: [] }),
      has: (id) => get().projects.some(p => p._id === id),
    }),
    // Read back from localStorage only after hydration (Providers calls rehydrate) — otherwise the first client render
    // would disagree with the server-rendered cards.
    { name: 'dd-project-compare', skipHydration: true },
  ),
)
