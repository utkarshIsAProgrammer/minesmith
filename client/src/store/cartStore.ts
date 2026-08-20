import { create } from 'zustand'
import type { Mod } from '@/services/api'

interface CartState {
  selectedMods: Map<string, Mod>
  addMod: (mod: Mod) => void
  removeMod: (modId: string) => void
  toggleMod: (mod: Mod) => void
  isSelected: (modId: string) => boolean
  clearCart: () => void
  getModIds: () => string[]
  getCount: () => number
}

function loadCart(): Map<string, Mod> {
  try {
    const raw = localStorage.getItem('minesmith_cart')
    if (!raw) return new Map()
    const entries: [string, Mod][] = JSON.parse(raw)
    return new Map(entries)
  } catch {
    return new Map()
  }
}

function saveCart(mods: Map<string, Mod>) {
  localStorage.setItem('minesmith_cart', JSON.stringify(Array.from(mods.entries())))
}

export const useCartStore = create<CartState>((set, get) => ({
  selectedMods: loadCart(),

  addMod: (mod) =>
    set((state) => {
      const newMap = new Map(state.selectedMods)
      newMap.set(mod.id, mod)
      saveCart(newMap)
      return { selectedMods: newMap }
    }),

  removeMod: (modId) =>
    set((state) => {
      const newMap = new Map(state.selectedMods)
      newMap.delete(modId)
      saveCart(newMap)
      return { selectedMods: newMap }
    }),

  toggleMod: (mod) => {
    if (get().selectedMods.has(mod.id)) {
      get().removeMod(mod.id)
    } else {
      get().addMod(mod)
    }
  },

  isSelected: (modId) => get().selectedMods.has(modId),

  clearCart: () => {
    saveCart(new Map())
    set({ selectedMods: new Map() })
  },

  getModIds: () => Array.from(get().selectedMods.keys()),

  getCount: () => get().selectedMods.size,
}))
