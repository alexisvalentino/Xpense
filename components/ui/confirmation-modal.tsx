"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, Trash2, Info } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type ConfirmationType = "danger" | "warning" | "info"

interface ConfirmationModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    type?: ConfirmationType
    isLoading?: boolean
}

export function ConfirmationModal({
    isOpen,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning",
    isLoading = false,
}: ConfirmationModalProps) {
    const icons = {
        danger: <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4"><AlertCircle className="h-6 w-6 text-red-500" /></div>,
        warning: <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4"><AlertTriangle className="h-6 w-6 text-amber-500" /></div>,
        info: <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4"><Info className="h-6 w-6 text-blue-500" /></div>,
    }

    const confirmVariants = {
        danger: "bg-red-500 hover:bg-red-600 font-bold",
        warning: "bg-amber-500 hover:bg-amber-600 font-bold",
        info: "bg-blue-500 hover:bg-blue-600 font-bold",
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] glass-modal bg-card/60 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden p-0">
                <div className="p-6 flex flex-col items-center text-center">
                    {icons[type]}
                    <DialogTitle className="text-xl font-bold mb-2">{title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground leading-relaxed">
                        {description}
                    </DialogDescription>
                </div>

                <DialogFooter className="bg-black/20 p-4 sm:flex-row gap-2 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 hover:bg-white/5 order-2 sm:order-1"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm()
                        }}
                        className={`flex-1 ${confirmVariants[type]} order-1 sm:order-2`}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
