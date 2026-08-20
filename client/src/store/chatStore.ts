import { create } from 'zustand'
import { sendMessage, type Mod, type Dependency, type ConflictGroup } from '@/services/api'
import { useCartStore } from './cartStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Analysis {
  themes: string[]
  difficulty: string
  gameplayStyle: string
}

interface SearchHistoryEntry {
  id: string
  query: string
  modCount: number
  timestamp: number
  messages: Message[]
  mods: Mod[]
  dependencies: Dependency[]
  conflicts: ConflictGroup[]
  analysis: Analysis | null
  sessionId: string | null
}

interface ChatState {
  messages: Message[]
  mods: Mod[]
  dependencies: Dependency[]
  conflicts: ConflictGroup[]
  loading: boolean
  analysis: Analysis | null
  error: string | null
  errorType: 'network' | 'ai' | 'modrinth' | 'config' | 'unknown' | null
  failedMessageIndex: number | null
  sessionId: string | null
  minecraftVersion: string
  loader: string
  searchHistory: SearchHistoryEntry[]
  isRefinement: boolean

  send: (message: string, isRefinement?: boolean) => Promise<void>
  retryFailedMessage: () => Promise<void>
  restoreHistory: (id: string) => void
  clearError: () => void
  clearChat: () => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  setMinecraftVersion: (v: string) => void
  setLoader: (l: string) => void
  selectAll: () => void
  deselectAll: () => void
  getActiveConflicts: () => ConflictGroup[]
}

function loadHistory(): SearchHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem('minesmith_history') || '[]')
  } catch {
    return []
  }
}

function saveHistory(history: SearchHistoryEntry[]) {
  localStorage.setItem('minesmith_history', JSON.stringify(history.slice(0, 10)))
}

function loadSession() {
  try {
    const raw = localStorage.getItem('minesmith_session')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveSession(state: { messages: Message[]; mods: Mod[]; dependencies: Dependency[]; conflicts: ConflictGroup[]; analysis: Analysis | null; sessionId: string | null; minecraftVersion: string; loader: string }) {
  localStorage.setItem('minesmith_session', JSON.stringify(state))
}

function clearSession() {
  localStorage.removeItem('minesmith_session')
}

const savedSession = loadSession()

export const useChatStore = create<ChatState>((set, get) => ({
  messages: savedSession?.messages || [],
  mods: savedSession?.mods || [],
  dependencies: savedSession?.dependencies || [],
  conflicts: savedSession?.conflicts || [],
  loading: false,
  analysis: savedSession?.analysis || null,
  error: null,
  errorType: null,
  failedMessageIndex: null as number | null,
  sessionId: savedSession?.sessionId || null,
  minecraftVersion: savedSession?.minecraftVersion || '1.20.1',
  loader: savedSession?.loader || 'fabric',
  searchHistory: loadHistory(),
  isRefinement: false,

  setMinecraftVersion: (v) => set({ minecraftVersion: v }),
  setLoader: (l) => set({ loader: l }),

  send: async (message: string, isRefinement = false) => {
    const { sessionId, mods: existingMods, messages: existingMessages, minecraftVersion, loader } = get()
    const userMsgIndex = existingMessages.length // capture BEFORE set

    set({
      loading: true,
      error: null,
      errorType: null,
      isRefinement,
      messages: [...existingMessages, { role: 'user', content: message }],
    })

    try {
      const res = await sendMessage(message, sessionId || undefined, minecraftVersion, loader)

      const newMods = isRefinement
        ? [...existingMods.filter(m => !res.mods.find((nm: Mod) => nm.id === m.id)), ...res.mods]
        : res.mods

      const finalMessages = [...existingMessages, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: res.aiResponse }]

      const history = get().searchHistory
      const newEntry: SearchHistoryEntry = {
        id: Date.now().toString(),
        query: message,
        modCount: newMods.length,
        timestamp: Date.now(),
        messages: finalMessages,
        mods: newMods,
        dependencies: res.dependencies,
        conflicts: res.conflicts || [],
        analysis: res.analysis,
        sessionId: res.sessionId,
      }
      const updatedHistory = [newEntry, ...history.filter(h => h.query !== message)].slice(0, 10)
      saveHistory(updatedHistory)

      const newState = {
        loading: false,
        messages: finalMessages,
        mods: newMods,
        dependencies: res.dependencies,
        conflicts: res.conflicts || [],
        analysis: res.analysis,
        sessionId: res.sessionId,
        searchHistory: updatedHistory,
      }
      set(newState)

      // Persist session
      saveSession({ messages: finalMessages, mods: newMods, dependencies: res.dependencies, conflicts: res.conflicts || [], analysis: res.analysis, sessionId: res.sessionId, minecraftVersion, loader })
    } catch (err: any) {
      let errorType: ChatState['errorType'] = 'unknown'
      let errorMsg = 'Something went wrong'

      if (err.message?.includes('No AI provider') || err.message?.includes('config')) {
        errorType = 'config'
        errorMsg = 'No AI provider configured. Open Settings ⚙️ to add a Groq API key or enable Ollama.'
      } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
        errorType = 'network'
        errorMsg = 'Cannot reach the server. Check if the backend is running on port 5000.'
      } else if (err.message?.includes('429') || err.message?.includes('rate')) {
        errorType = 'ai'
        errorMsg = 'AI service temporarily rate-limited. Retrying with fallback...'
      } else if (err.message?.includes('503') || err.message?.includes('Modrinth')) {
        errorType = 'modrinth'
        errorMsg = 'Modrinth API temporarily unavailable. Check your internet connection.'
      } else {
        errorMsg = err.message || 'Something went wrong'
      }

    set({
      loading: false,
      error: errorMsg,
      errorType,
      failedMessageIndex: userMsgIndex,
    })

      setTimeout(() => {
        const current = get().error
        if (current === errorMsg) {
          set({ error: null, errorType: null })
        }
      }, 8000)
    }
  },

  restoreHistory: (id) => {
    const entry = get().searchHistory.find(h => h.id === id)
    if (!entry) return
    const state = {
      messages: entry.messages || [],
      mods: entry.mods || [],
      dependencies: entry.dependencies || [],
      conflicts: entry.conflicts || [],
      analysis: entry.analysis || null,
      sessionId: entry.sessionId || null,
      error: null,
      errorType: null,
      loading: false,
      isRefinement: false,
    }
    set(state)
    saveSession({ ...state, minecraftVersion: get().minecraftVersion, loader: get().loader })
  },

  clearError: () => set({ error: null, errorType: null, failedMessageIndex: null }),

  retryFailedMessage: async () => {
    const { failedMessageIndex, messages } = get()
    if (failedMessageIndex === null || failedMessageIndex < 0) return

    const failedMsg = messages[failedMessageIndex]
    if (!failedMsg || failedMsg.role !== 'user') return

    // Remove the failed user message
    const trimmedMessages = messages.slice(0, failedMessageIndex)
    set({ messages: trimmedMessages, error: null, errorType: null, failedMessageIndex: null })

    // Re-send
    await get().send(failedMsg.content, get().mods.length > 0)
  },

  clearChat: () => {
    clearSession()
    set({
      messages: [],
      mods: [],
      dependencies: [],
      conflicts: [],
      analysis: null,
      sessionId: null,
      error: null,
      errorType: null,
      failedMessageIndex: null,
      isRefinement: false,
    })
  },

  removeFromHistory: (id) => {
    const history = get().searchHistory.filter(h => h.id !== id)
    saveHistory(history)
    set({ searchHistory: history })
  },

  clearHistory: () => {
    saveHistory([])
    set({ searchHistory: [] })
  },

  selectAll: () => {
    const { mods } = get()
    const cart = useCartStore.getState()
    for (const mod of mods) {
      cart.addMod(mod)
    }
  },

  deselectAll: () => {
    const cart = useCartStore.getState()
    cart.clearCart()
  },

  getActiveConflicts: () => {
    const { conflicts } = get()
    const cartSlugs = Array.from(useCartStore.getState().selectedMods.values()).map(m => m.slug.toLowerCase())
    return conflicts.filter(group =>
      group.mods.filter(m => cartSlugs.includes(m)).length > 1
    )
  },
}))
