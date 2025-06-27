"use client"

import * as React from "react"

// Tipos simplificados
export interface ToastProps {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ToasterToast extends ToastProps {
  id: string
}

interface ToastState {
  toasts: ToasterToast[]
}

// Estado global
const toastState: ToastState = {
  toasts: []
}

const listeners = new Set<(state: ToastState) => void>()

function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener(toastState)
    } catch (error) {
      console.error('Toast listener error:', error)
    }
  })
}

// Contador para IDs únicos
let toastCount = 0

function generateId(): string {
  return `toast-${++toastCount}-${Date.now()}`
}

// Función principal de toast
export function toast({
  title,
  description,
  action,
  variant = "default",
  duration = 5000,
  ...props
}: Omit<ToastProps, 'id'>) {
  const id = generateId()
  
  const toastItem: ToasterToast = {
    id,
    title,
    description,
    action,
    variant,
    duration,
    open: true,
    ...props
  }

  // Agregar el toast
  toastState.toasts.push(toastItem)
  notifyListeners()

  // Configurar auto-dismiss
  const timeoutId = setTimeout(() => {
    dismissToast(id)
  }, duration)

  // Función para dismiss manual
  const dismiss = () => {
    clearTimeout(timeoutId)
    dismissToast(id)
  }

  return { id, dismiss }
}

function dismissToast(id: string) {
  const index = toastState.toasts.findIndex(t => t.id === id)
  if (index > -1) {
    toastState.toasts.splice(index, 1)
    notifyListeners()
  }
}

// Hook de toast
export function useToast() {
  const [state, setState] = React.useState<ToastState>(toastState)

  React.useEffect(() => {
    const listener = (newState: ToastState) => {
      setState({ toasts: [...newState.toasts] })
    }

    listeners.add(listener)
    
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    toasts: state.toasts,
    toast,
    dismiss: dismissToast
  }
}
