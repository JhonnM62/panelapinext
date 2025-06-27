"use client"

import * as React from "react"
import { X } from '@/components/ui/icons'
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            w-full max-w-sm rounded-lg border p-4 shadow-lg
            ${toast.variant === "destructive" 
              ? "border-red-500 bg-red-50 text-red-900 dark:border-red-400 dark:bg-red-900 dark:text-red-100" 
              : "border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              {toast.title && (
                <div className="text-sm font-semibold">
                  {toast.title}
                </div>
              )}
              {toast.description && (
                <div className="text-sm opacity-90">
                  {toast.description}
                </div>
              )}
              {toast.action && (
                <div className="mt-2">
                  {toast.action}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity"
              type="button"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
