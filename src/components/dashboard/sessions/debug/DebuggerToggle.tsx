'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SessionDebugger } from './SessionDebugger'
import { Bug } from 'lucide-react'

export function DebuggerToggle() {
  const [open, setOpen] = useState(false)

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Depurador de Sesiones</DialogTitle>
        </DialogHeader>
        <SessionDebugger />
      </DialogContent>
    </Dialog>
  )
}
