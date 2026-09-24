import { create } from 'zustand'
import { favAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface FavoritesState {
  favorites: string[]
  // Off-plan projects are saved separately on the server (a different model), same heart on the card.
  projectFavorites: string[]
  isLoading: boolean
  fetchFavorites: () => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  isFavorite: (id: string) => boolean
  toggleProjectFavorite: (id: string) => Promise<void>
  isProjectFavorite: (id: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  projectFavorites: [],
  isLoading: false,

  fetchFavorites: async () => {
    const [props, projs] = await Promise.allSettled([favAPI.getAll(), favAPI.getProjects()])
    if (props.status === 'fulfilled') set({ favorites: props.value.data.data.map((p: any) => p._id || p) })
    if (projs.status === 'fulfilled') set({ projectFavorites: projs.value.data.data.map((p: any) => p._id || p) })
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

  toggleProjectFavorite: async (id) => {
    const prev = get().projectFavorites
    const isFav = prev.includes(id)
    set({ projectFavorites: isFav ? prev.filter(f => f !== id) : [...prev, id] })
    try {
      await favAPI.toggleProject(id)
      toast.success(isFav ? 'Removed from favorites' : 'Added to favorites')
    } catch {
      set({ projectFavorites: prev })
      toast.error('Failed to update favorites')
    }
  },

  isProjectFavorite: (id) => get().projectFavorites.includes(id),
}))
