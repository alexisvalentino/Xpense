"use client"

import * as React from "react"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
    id: string
    message: string
    description?: string
    type?: ToastType
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

interface ToastContextType {
    toasts: Toast[]
    toast: (payload: Omit<Toast, "id">) => void
    removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const toast = React.useCallback((payload: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { ...payload, id }
        setToasts((prev) => [...prev, newToast])

        if (payload.duration !== 0) {
            setTimeout(() => {
                removeToast(id)
            }, payload.duration || 5000)
        }
    }, [])

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toasts, toast, removeToast }}>
            {children}
            <div className="fixed bottom-0 right-0 z-[100] p-4 md:p-6 space-y-4 w-full max-w-[420px] pointer-events-none flex flex-col items-end">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10)
        return () => clearTimeout(timer)
    }, [])

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    }

    return (
        <div
            className={`pointer-events-auto w-full glass-modal p-4 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-4 transition-all duration-500 transform ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95"
                }`}
        >
            <div className="flex-shrink-0 mt-0.5">
                {toast.type ? icons[toast.type] : icons.info}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground leading-tight">{toast.message}</h4>
                {toast.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{toast.description}</p>
                )}
                {toast.action && (
                    <button
                        onClick={() => {
                            toast.action?.onClick()
                            onRemove()
                        }}
                        className="mt-3 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors uppercase tracking-wider"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button
                onClick={onRemove}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

export function useToast() {
    const context = React.useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
