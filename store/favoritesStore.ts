import { create } from 'zustand'
import { favAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface FavoritesState {
  favorites: string[]
  isLoading: boolean
  fetchFavorites: () => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  isFavorite: (id: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,

  fetchFavorites: async () => {
    try {
      const res = await favAPI.getAll()
      set({ favorites: res.data.data.map((p: any) => p._id || p) })
    } catch {}
  },

  toggleFavorite: async (id) => {
    const prev = get().favorites
    const isFav = prev.includes(id)
    set({ favorites: isFav ? prev.filter(f => f !== id) : [...prev, id] })
    try {
      await favAPI.toggle(id)
      toast.success(isFav ? 'Removed from favorites' : 'Added to favorites')
    } catch {
      set({ favorites: prev })
      toast.error('Failed to update favorites')
    }
  },

  isFavorite: (id) => get().favorites.includes(id),
}))