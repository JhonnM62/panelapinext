'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { 
  MessageSquare, 
  Search, 
  RefreshCw, 
  User, 
  Users, 
  Image, 
  Video, 
  FileText, 
  MapPin,
  Clock,
  Download
} from 'lucide-react'
import { baileysAPI } from '@/lib/api'

interface Chat {
  id: string;
  name?: string;
  unreadCount: number;
  conversationTimestamp: string;
  lastMessage?: string;
  isGroup?: boolean;
}

interface Message {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: any;
  messageTimestamp: string;
  status?: string;
}

interface ChatListProps {
  sessionId?: string;
}

export function ChatList({ sessionId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (sessionId) {
      loadChats()
    }
  }, [sessionId])

  const loadChats = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      const response = await baileysAPI.getChatList(sessionId)
      
      if (response.success) {
        const formattedChats = response.data.map((chat: any) => ({
          id: chat.id,
          name: extractNameFromJid(chat.id),
          unreadCount: chat.unreadCount || 0,
          conversationTimestamp: chat.conversationTimestamp,
          isGroup: chat.id.includes('@g.us')
        }))
        
        setChats(formattedChats)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los chats',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (chat: Chat) => {
    if (!sessionId) return

    try {
      setLoadingMessages(true)
      const response = await baileysAPI.getConversation(
        sessionId,
        chat.id,
        25,
        chat.isGroup || false
      )
      
      if (response.success) {
        setMessages(response.data || [])
        setSelectedChat(chat)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mensajes',
        variant: 'destructive'
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  const extractNameFromJid = (jid: string): string => {
    if (jid.includes('@g.us')) {
      return `Grupo ${jid.split('@')[0].slice(-4)}`
    }
    return jid.split('@')[0]
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp) * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffDays === 1) {
      return 'Ayer'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const getMessageContent = (message: Message): string => {
    const msg = message.message

    if (msg.conversation) {
      return msg.conversation
    }
    if (msg.extendedTextMessage?.text) {
      return msg.extendedTextMessage.text
    }
    if (msg.imageMessage) {
      return '📷 Imagen'
    }
    if (msg.videoMessage) {
      return '🎥 Video'
    }
    if (msg.audioMessage) {
      return '🎵 Audio'
    }
    if (msg.documentMessage) {
      return `📄 ${msg.documentMessage.fileName || 'Documento'}`
    }
    if (msg.locationMessage) {
      return '📍 Ubicación'
    }
    if (msg.contactMessage) {
      return '👤 Contacto'
    }
    if (msg.stickerMessage) {
      return '🎭 Sticker'
    }
    if (msg.pollCreationMessage) {
      return '📊 Encuesta'
    }
    if (msg.reactionMessage) {
      return `${msg.reactionMessage.text} Reacción`
    }

    return 'Mensaje no compatible'
  }

  const getMessageIcon = (message: Message) => {
    const msg = message.message

    if (msg.imageMessage) return <Image className="h-4 w-4" />
    if (msg.videoMessage) return <Video className="h-4 w-4" />
    if (msg.documentMessage) return <FileText className="h-4 w-4" />
    if (msg.locationMessage) return <MapPin className="h-4 w-4" />

    return null
  }

  const downloadMedia = async (message: Message) => {
    if (!sessionId || !selectedChat) return

    try {
      const response = await baileysAPI.downloadMedia(sessionId, {
        remoteJid: selectedChat.id,
        isGroup: selectedChat.isGroup || false,
        messageId: message.key.id
      })

      if (response.success) {
        toast({
          title: 'Descarga iniciada',
          description: 'El archivo se está descargando',
        })
      }
    } catch (error) {
      console.error('Error downloading media:', error)
      toast({
        title: 'Error',
        description: 'No se pudo descargar el archivo',
        variant: 'destructive'
      })
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">Selecciona una sesión para ver los chats</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lista de chats */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Chats</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadChats}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando chats...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay chats disponibles</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => loadMessages(chat)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={``} />
                    <AvatarFallback>
                      {chat.isGroup ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{chat.name}</h4>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(chat.conversationTimestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.isGroup ? 'Grupo' : 'Individual'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 text-xs">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversación */}
      <Card className="lg:col-span-2">
        <CardHeader>
          {selectedChat ? (
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={``} />
                <AvatarFallback>
                  {selectedChat.isGroup ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{selectedChat.name}</CardTitle>
                <CardDescription>
                  {selectedChat.isGroup ? 'Grupo' : 'Chat individual'}
                </CardDescription>
              </div>
            </div>
          ) : (
            <CardTitle>Selecciona un chat</CardTitle>
          )}
        </CardHeader>
        <CardContent>
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando mensajes...</span>
            </div>
          ) : !selectedChat ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500">Selecciona un chat para ver la conversación</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay mensajes en esta conversación</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.key.id}
                  className={`flex ${message.key.fromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                      message.key.fromMe
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {getMessageIcon(message)}
                      <div className="flex-1">
                        <p className="text-sm">{getMessageContent(message)}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {formatTimestamp(message.messageTimestamp)}
                          </span>
                          {(message.message.imageMessage || 
                            message.message.videoMessage || 
                            message.message.documentMessage) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-2"
                              onClick={() => downloadMedia(message)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
