import { useState, useEffect, useCallback } from 'react'
import { baileysAPI, type ApiResponse } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

interface Session {
  id: string
  status?: 'authenticated' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected'
  lastUpdate?: Date
}

interface Chat {
  id: string
  name?: string
  unreadCount: number
  conversationTimestamp: string
  lastMessage?: string
  isGroup?: boolean
}

interface Message {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
    participant?: string
  }
  message: any
  messageTimestamp: string
  status?: string
}

export function useWhatsAppSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await baileysAPI.listSessions()
      
      if (response.success) {
        const sessionList = response.data.map((id: string) => ({ 
          id,
          lastUpdate: new Date()
        }))
        setSessions(sessionList)
        
        // Obtener estado de cada sesión
        await Promise.all(
          sessionList.map(async (session) => {
            try {
              const statusResponse = await baileysAPI.getSessionStatus(session.id)
              if (statusResponse.success) {
                setSessions(prev => 
                  prev.map(s => 
                    s.id === session.id 
                      ? { ...s, status: statusResponse.data.status, lastUpdate: new Date() }
                      : s
                  )
                )
              }
            } catch (error) {
              console.error(`Error getting status for session ${session.id}:`, error)
            }
          })
        )
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sesiones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createSession = useCallback(async (sessionId?: string): Promise<{ qr?: string, sessionId: string } | null> => {
    try {
      setLoading(true)
      const id = sessionId || `session_${Date.now()}`
      
      const response = await baileysAPI.createSession({
        id,
        typeAuth: 'qr'
      })

      if (response.success) {
        const newSession: Session = {
          id,
          status: 'connecting',
          lastUpdate: new Date()
        }
        setSessions(prev => [...prev, newSession])
        
        toast({
          title: 'Sesión creada',
          description: 'Escanea el código QR para conectar WhatsApp',
        })
        
        return {
          qr: response.data.qr,
          sessionId: id
        }
      }
      return null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: 'No se pudo crear la sesión',
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const response = await baileysAPI.deleteSession(sessionId)
      
      if (response.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        toast({
          title: 'Sesión eliminada',
          description: 'La sesión ha sido eliminada correctamente',
        })
        return true
      }
      return false
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la sesión',
        variant: 'destructive'
      })
      return false
    }
  }, [toast])

  const getSessionStatus = useCallback(async (sessionId: string): Promise<string | null> => {
    try {
      const response = await baileysAPI.getSessionStatus(sessionId)
      
      if (response.success) {
        // Actualizar estado en la lista
        setSessions(prev => 
          prev.map(s => 
            s.id === sessionId 
              ? { ...s, status: response.data.status, lastUpdate: new Date() }
              : s
          )
        )
        return response.data.status
      }
      return null
    } catch (error) {
      console.error('Error getting session status:', error)
      return null
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return {
    sessions,
    loading,
    error,
    loadSessions,
    createSession,
    deleteSession,
    getSessionStatus
  }
}

export function useWhatsAppChats(sessionId?: string) {
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadChats = useCallback(async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      setError(null)
      
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
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los chats',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [sessionId, toast])

  const loadMessages = useCallback(async (chat: Chat) => {
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
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los mensajes',
        variant: 'destructive'
      })
    } finally {
      setLoadingMessages(false)
    }
  }, [sessionId, toast])

  const extractNameFromJid = (jid: string): string => {
    if (jid.includes('@g.us')) {
      return `Grupo ${jid.split('@')[0].slice(-4)}`
    }
    return jid.split('@')[0]
  }

  useEffect(() => {
    if (sessionId) {
      loadChats()
    }
  }, [sessionId, loadChats])

  return {
    chats,
    messages,
    selectedChat,
    loading,
    loadingMessages,
    error,
    loadChats,
    loadMessages,
    setSelectedChat
  }
}

export function useWhatsAppMessages(sessionId?: string) {
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      setUploading(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Error uploading file')
      }
      
      const data = await response.json()
      return data.url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: 'No se pudo subir el archivo',
        variant: 'destructive'
      })
      return null
    } finally {
      setUploading(false)
    }
  }, [toast])

  const sendTextMessage = useCallback(async (
    recipient: string,
    text: string,
    isGroup: boolean = false
  ): Promise<boolean> => {
    if (!sessionId) return false

    try {
      setSending(true)
      setError(null)
      
      const response = await baileysAPI.sendTextMessage(sessionId, {
        receiver: recipient,
        isGroup,
        message: { text }
      })

      if (response.success) {
        toast({
          title: 'Mensaje enviado',
          description: 'El mensaje se envió correctamente',
        })
        return true
      }
      return false
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      })
      return false
    } finally {
      setSending(false)
    }
  }, [sessionId, toast])

  const sendImageMessage = useCallback(async (
    recipient: string,
    imageFile: File,
    caption?: string,
    isGroup: boolean = false
  ): Promise<boolean> => {
    if (!sessionId) return false

    try {
      setSending(true)
      
      const imageUrl = await uploadFile(imageFile)
      if (!imageUrl) return false
      
      const response = await baileysAPI.sendImageMessage(sessionId, {
        receiver: recipient,
        isGroup,
        message: {
          image: { url: imageUrl },
          caption
        }
      })

      if (response.success) {
        toast({
          title: 'Imagen enviada',
          description: 'La imagen se envió correctamente',
        })
        return true
      }
      return false
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: 'No se pudo enviar la imagen',
        variant: 'destructive'
      })
      return false
    } finally {
      setSending(false)
    }
  }, [sessionId, uploadFile, toast])

  return {
    sending,
    uploading,
    error,
    uploadFile,
    sendTextMessage,
    sendImageMessage
  }
}
