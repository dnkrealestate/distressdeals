import { create } from 'zustand'
import type { Property } from '@/types'
import toast from 'react-hot-toast'

interface CompareState {
  compareList: Property[]
  addToCompare: (property: Property) => void
  removeFromCompare: (id: string) => void
  clearCompare: () => void
  isInCompare: (id: string) => boolean
}

export const useCompareStore = create<CompareState>((set, get) => ({
  compareList: [],

  addToCompare: (property) => {
    const list = get().compareList
    if (list.length >= 2) { toast.error('You can compare up to 2 properties'); return }
    if (list.find(p => p._id === property._id)) { toast('Already in compare list'); return }
    set({ compareList: [...list, property] })
    toast.success('Added to compare')
  },

  removeFromCompare: (id) => {
    set({ compareList: get().compareList.filter(p => p._id !== id) })
  },

  clearCompare: () => set({ compareList: [] }),

  isInCompare: (id) => get().compareList.some(p => p._id === id),
}))