import { create } from 'zustand'

export type ViewType = 'dashboard' | 'add-trade' | 'history' | 'reports' | 'ai-analyzer' | 'calendar' | 'backtest'

interface AppState {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
  editingTradeId: string | null
  setEditingTradeId: (id: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view, editingTradeId: view === 'add-trade' ? null : undefined }),
  editingTradeId: null,
  setEditingTradeId: (id) => set({ editingTradeId: id, currentView: 'add-trade' }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
