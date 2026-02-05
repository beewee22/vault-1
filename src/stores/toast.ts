import { proxy } from 'valtio'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning'
  message: string
  timestamp: number
}

export const toastStore = proxy({
  toasts: [] as Toast[]
})

export const toastActions = {
  addToast: (type: 'success' | 'error' | 'warning', message: string) => {
    const id = crypto.randomUUID()
    toastStore.toasts.push({ id, type, message, timestamp: Date.now() })

    // Limit to 3 visible toasts
    if (toastStore.toasts.length > 3) {
      toastStore.toasts.shift()
    }

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      toastActions.removeToast(id)
    }, 4000)
  },

  removeToast: (id: string) => {
    const index = toastStore.toasts.findIndex(t => t.id === id)
    if (index > -1) {
      toastStore.toasts.splice(index, 1)
    }
  },

  success: (message: string) => toastActions.addToast('success', message),
  error: (message: string) => toastActions.addToast('error', message),
  warning: (message: string) => toastActions.addToast('warning', message)
}
