import { proxy, subscribe } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { profileStore } from './profile'
import { migrateProfiles } from '../types'

// Migration: Move global favorites/recent to first profile's scoped keys
function runMigration(profiles: any[]) {
  if (typeof localStorage === 'undefined' || profiles.length === 0) return
  const firstProfileId = profiles[0].id

  const globalFavs = localStorage.getItem('vault_favorites')
  if (globalFavs) {
    const scopedKey = `vault_favorites_${firstProfileId}`
    if (!localStorage.getItem(scopedKey)) {
      localStorage.setItem(scopedKey, globalFavs)
    }
    localStorage.removeItem('vault_favorites')
  }

  const globalRecent = localStorage.getItem('vault_recent')
  if (globalRecent) {
    const scopedKey = `vault_recent_${firstProfileId}`
    if (!localStorage.getItem(scopedKey)) {
      localStorage.setItem(scopedKey, globalRecent)
    }
    localStorage.removeItem('vault_recent')
  }
}

function loadForProfile(profileId: string) {
  if (typeof localStorage === 'undefined' || !profileId) return
  const favKey = `vault_favorites_${profileId}`
  const recentKey = `vault_recent_${profileId}`
  const savedFavs = localStorage.getItem(favKey)
  const savedRecent = localStorage.getItem(recentKey)
  vaultStore.favorites = savedFavs ? JSON.parse(savedFavs) : []
  vaultStore.recentlyUsed = savedRecent ? JSON.parse(savedRecent) : []
}

// Run migration on init
runMigration(profileStore.profiles)

// Load initial profile data
const initFavs = typeof localStorage !== 'undefined' && profileStore.activeProfileId
  ? JSON.parse(localStorage.getItem(`vault_favorites_${profileStore.activeProfileId}`) || '[]')
  : []
const initRecent = typeof localStorage !== 'undefined' && profileStore.activeProfileId
  ? JSON.parse(localStorage.getItem(`vault_recent_${profileStore.activeProfileId}`) || '[]')
  : []

export const vaultStore = proxy({
  favorites: initFavs as any[],
  recentlyUsed: initRecent as any[],
})

export const vaultActions = {
  toggleFavorite: (secret: any) => {
    const idx = vaultStore.favorites.findIndex((f: any) => f.path === secret.path)
    if (idx !== -1) {
      vaultStore.favorites.splice(idx, 1)
    } else {
      vaultStore.favorites.push({ ...secret, isFavorite: true })
    }
  },
  addToRecent: (secret: any) => {
    const filtered = vaultStore.recentlyUsed.filter((s: any) => s.path !== secret.path)
    vaultStore.recentlyUsed = [{ ...secret, lastUsed: new Date().toISOString() }, ...filtered].slice(0, 10)
  },
  loadForProfile,
}

// Persist favorites and recentlyUsed to scoped localStorage
if (typeof localStorage !== 'undefined') {
  subscribe(vaultStore, () => {
    const pid = profileStore.activeProfileId
    if (pid) {
      localStorage.setItem(`vault_favorites_${pid}`, JSON.stringify(vaultStore.favorites))
      localStorage.setItem(`vault_recent_${pid}`, JSON.stringify(vaultStore.recentlyUsed))
    }
  })

  // Reload when active profile changes
  subscribeKey(profileStore, 'activeProfileId', (newId) => {
    loadForProfile(newId)
  })
}
