import { proxy } from 'valtio'

export const authStore = proxy({
  isLoggedIn: false,
  isLoggingIn: false,
  token: '',
  vaultUrl: '',
  error: '',
})

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
