import { proxy, subscribe } from 'valtio'

const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('vault_theme') : null
const savedAutoLock = typeof localStorage !== 'undefined' ? localStorage.getItem('vault_autolock') : null

export const uiStore = proxy({
  activeTab: 'all',
  isSidebarOpen: true,
  isLocked: false,
  isLoginAddProfileOpen: false,
  theme: savedTheme || 'dark',
  autoLockTimeout: savedAutoLock ? Number(savedAutoLock) : 15,
  lastActivity: Date.now(),
})

export const uiActions = {
  setTab: (tab: string) => { uiStore.activeTab = tab },
  toggleSidebar: () => { uiStore.isSidebarOpen = !uiStore.isSidebarOpen },
  openSidebar: () => { uiStore.isSidebarOpen = true },
  closeSidebar: () => { uiStore.isSidebarOpen = false },
  lock: () => { uiStore.isLocked = true },
  unlock: () => { uiStore.isLocked = false },
  setTheme: (theme: string) => { uiStore.theme = theme },
  setAutoLockTimeout: (minutes: number) => { uiStore.autoLockTimeout = minutes },
  updateActivity: () => { uiStore.lastActivity = Date.now() },
  setLoginAddProfileOpen: (open: boolean) => { uiStore.isLoginAddProfileOpen = open },
}

// Persist theme and autoLockTimeout to localStorage + apply theme class
if (typeof localStorage !== 'undefined') {
  subscribe(uiStore, () => {
    localStorage.setItem('vault_theme', uiStore.theme)
    localStorage.setItem('vault_autolock', uiStore.autoLockTimeout.toString())

    // Apply theme
    if (uiStore.theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  })

  // Apply theme on init
  if (uiStore.theme === 'light') {
    document.documentElement.classList.add('light')
  }
}
