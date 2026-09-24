import { create } from 'zustand'
import type { Property } from '@/types'
import toast from 'react-hot-toast'
import { userAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useProjectCompareStore } from '@/store/projectCompareStore'
import { warnCompareConflict, READY_VS_OFFPLAN, READY_VS_PROJECT, OFFPLAN_VS_PROJECT } from '@/components/buyer/compareConflict'

interface CompareState {
  compareList: Property[]
  addToCompare: (property: Property) => void
  removeFromCompare: (id: string) => void
  clearCompare: () => void
  isInCompare: (id: string) => boolean
  // Signed-in users: pull the saved list on login, and push every change (fire-and-forget).
  loadFromServer: () => Promise<void>
}

// Rentals and listings saved before `completion` existed count as ready.
const completionOf = (p: Property) => (p.completion === 'off_plan' ? 'off_plan' : 'ready')

// The buyer's agent reads this list, so it lives on the server for signed-in users.
const pushToServer = (list: Property[]) => {
  if (!useAuthStore.getState().token) return
  userAPI.setCompare(list.map(p => p._id)).catch(() => {})
}

export const useCompareStore = create<CompareState>((set, get) => ({
  compareList: [],

  loadFromServer: async () => {
    try {
      const res = await userAPI.getCompare()
      const server: Property[] = res.data.data || []
      // Anything picked before signing in joins the saved list (this page compares up to 2).
      const merged = [...server, ...get().compareList.filter(l => !server.some(s => s._id === l._id))].slice(0, 2)
      set({ compareList: merged })
      if (merged.length !== server.length) pushToServer(merged)
    } catch {}
  },

  addToCompare: (property) => {
    const list = get().compareList
    if (list.find(p => p._id === property._id)) { toast('Already in compare list'); return }
    const startWithThis = () => { set({ compareList: [property] }); pushToServer([property]); toast.success('Added to compare') }

    // Ready and off-plan don't compare like-for-like — warn, and offer to start over with this one.
    const kind = completionOf(property)
    if (list.some(p => completionOf(p) !== kind)) { warnCompareConflict(READY_VS_OFFPLAN, startWithThis); return }
    const projects = useProjectCompareStore.getState().projects
    if (projects.length) {
      warnCompareConflict(kind === 'ready' ? READY_VS_PROJECT : OFFPLAN_VS_PROJECT, () => {
        useProjectCompareStore.getState().clear(); startWithThis()
      })
      return
    }

    if (list.length >= 2) { toast.error('You can compare up to 2 properties'); return }
    const next = [...list, property]
    set({ compareList: next })
    pushToServer(next)
    toast.success('Added to compare')
  },

  removeFromCompare: (id) => {
    const next = get().compareList.filter(p => p._id !== id)
    set({ compareList: next })
    pushToServer(next)
  },

  clearCompare: () => { set({ compareList: [] }); pushToServer([]) },

  isInCompare: (id) => get().compareList.some(p => p._id === id),
}))