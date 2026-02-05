import { proxy, subscribe } from 'valtio'
import { migrateProfiles, type VaultProfile } from '../types'

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('vault_profiles') : null
const parsed = saved ? JSON.parse(saved) : [{ id: 'default', name: 'Default', url: 'http://127.0.0.1:8200', token: '' }]
const migrated = migrateProfiles(parsed)

const savedActiveId = typeof localStorage !== 'undefined' ? localStorage.getItem('vault_active_profile') : null

export const profileStore = proxy({
  profiles: migrated as VaultProfile[],
  activeProfileId: savedActiveId || migrated[0]?.id || '',
  get activeProfile(): VaultProfile {
    return this.profiles.find((p: VaultProfile) => p.id === this.activeProfileId) || this.profiles[0]
  },
})

export const profileActions = {
  addProfile: (profile: Omit<VaultProfile, 'id'>) => {
    const newProfile: VaultProfile = { id: Date.now().toString(), ...profile }
    profileStore.profiles.push(newProfile)
    profileStore.activeProfileId = newProfile.id
    return newProfile
  },
  removeProfile: (id: string) => {
    const idx = profileStore.profiles.findIndex((p: VaultProfile) => p.id === id)
    if (idx !== -1) profileStore.profiles.splice(idx, 1)
  },
  setActiveProfile: (id: string) => {
    profileStore.activeProfileId = id
  },
}

// Persist to localStorage
if (typeof localStorage !== 'undefined') {
  subscribe(profileStore, () => {
    localStorage.setItem('vault_profiles', JSON.stringify(profileStore.profiles))
    localStorage.setItem('vault_active_profile', profileStore.activeProfileId)
  })
}
