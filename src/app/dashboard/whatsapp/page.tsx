'use client'

import { Suspense } from 'react'
import { WhatsAppDashboard } from '@/components/whatsapp'
import { RefreshCw } from 'lucide-react'

function WhatsAppPageContent() {
  return <WhatsAppDashboard />
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
        <h3 className="text-lg font-semibold mb-2">Cargando WhatsApp Dashboard</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Preparando la interfaz de gestión de WhatsApp...
        </p>
      </div>
    </div>
  )
}

export default function WhatsAppPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WhatsAppPageContent />
    </Suspense>
  )
}
