import React from 'react'
import { useSnapshot } from 'valtio'
import { toastStore, toastActions } from '../stores/toast'
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react'

function Toast({ id, type, message }: { id: string; type: string; message: string }) {
  const bgColor = type === 'success' ? 'bg-green-900/80' : type === 'error' ? 'bg-red-900/80' : 'bg-amber-900/80'
  const borderColor = type === 'success' ? 'border-green-700' : type === 'error' ? 'border-red-700' : 'border-amber-700'
  const textColor = type === 'success' ? 'text-green-100' : type === 'error' ? 'text-red-100' : 'text-amber-100'
  const iconColor = type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-amber-400'

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : AlertTriangle

  return (
    <div
      className={`${bgColor} ${borderColor} ${textColor} border rounded-lg p-4 flex items-start gap-3 min-w-80 animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <Icon className={`${iconColor} w-5 h-5 flex-shrink-0 mt-0.5`} />
      <div className="flex-1 text-sm">{message}</div>
      <button
        onClick={() => toastActions.removeToast(id)}
        className="flex-shrink-0 text-current hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const snap = useSnapshot(toastStore)

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-auto">
      {snap.toasts.map(toast => (
        <Toast key={toast.id} id={toast.id} type={toast.type} message={toast.message} />
      ))}
    </div>
  )
}

export default ToastContainer
