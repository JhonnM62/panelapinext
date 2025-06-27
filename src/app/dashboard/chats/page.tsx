'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Send, Users, BarChart3 } from 'lucide-react'
import MessageSenderComponent from '@/components/dashboard/message-sender'

// Importar el componente de chats existente si existe, sino crear una versión básica
function ChatsListComponent() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
          Vista de Chats
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Esta funcionalidad se está desarrollando. Por ahora puedes usar el envío de mensajes.
        </p>
      </div>
    </div>
  )
}

function ChatAnalyticsComponent() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
          Analytics de Chats
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Próximamente: estadísticas detalladas de tus conversaciones y mensajes.
        </p>
      </div>
    </div>
  )
}

export default function ChatsPage() {
  const [activeTab, setActiveTab] = useState('send')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Gestión de Mensajes
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Envía mensajes, gestiona conversaciones y analiza tu actividad en WhatsApp
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Enviar
          </TabsTrigger>
          <TabsTrigger value="chats" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <MessageSenderComponent />
        </TabsContent>

        <TabsContent value="chats">
          <ChatsListComponent />
        </TabsContent>

        <TabsContent value="analytics">
          <ChatAnalyticsComponent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
