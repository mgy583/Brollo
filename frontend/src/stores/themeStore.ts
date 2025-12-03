import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeOption = 'light' | 'dark'

interface ThemeState {
  theme: ThemeOption
  setTheme: (t: ThemeOption) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // default to light theme
      theme: 'light',
      setTheme: (t: ThemeOption) => set({ theme: t }),
      toggle: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'brollo-theme',
    }
  )
)
