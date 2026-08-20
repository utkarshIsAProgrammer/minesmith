import { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, AlertTriangle, Info, Download } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'action'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const icons = {
    success: <Check className="h-4 w-4 text-emerald-400" />,
    error: <AlertTriangle className="h-4 w-4 text-red-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />,
    action: <Download className="h-4 w-4 text-primary" />,
  }

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
    action: 'border-primary/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex items-center gap-3 bg-background ${borders[toast.type]} border-2 px-4 py-3 pixel-card cursor-pointer`}
      onClick={() => onRemove(toast.id)}
    >
      {icons[toast.type]}
      <span className="text-sm text-foreground flex-1">{toast.message}</span>
      <button onClick={(e) => { e.stopPropagation(); onRemove(toast.id) }} className="text-muted-foreground hover:text-foreground cursor-pointer">
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  )
}
