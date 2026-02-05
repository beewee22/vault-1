import { proxy } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { profileStore } from './profile'

export const authStore = proxy({
  isLoggedIn: false,
  isLoggingIn: false,
  token: '',
  vaultUrl: '',
  error: '',
})

// Sync vaultUrl from active profile on initial load
authStore.vaultUrl = profileStore.activeProfile?.url || ''

export const authActions = {
  setToken: (token: string) => { authStore.token = token },
  setVaultUrl: (url: string) => { authStore.vaultUrl = url },
  setError: (error: string) => { authStore.error = error },
  setLoggingIn: (v: boolean) => { authStore.isLoggingIn = v },
  login: (token: string, url: string) => {
    authStore.token = token
    authStore.vaultUrl = url
    authStore.isLoggedIn = true
    authStore.isLoggingIn = false
    authStore.error = ''
  },
  logout: () => {
    authStore.token = ''
    authStore.isLoggedIn = false
  },
}

// Sync vaultUrl when active profile changes
subscribeKey(profileStore, 'activeProfileId', () => {
  authStore.vaultUrl = profileStore.activeProfile?.url || ''
})
