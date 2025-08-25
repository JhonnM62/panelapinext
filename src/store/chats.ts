import { create } from 'zustand'
import { Chat, Message, SendMessageRequest } from '@/types'
import { chatsAPI, baileysAPI } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-utils'

interface ChatsState {
  chats: Chat[]
  messages: Message[]
  selectedChat: Chat | null
  selectedSession: string | null
  isLoading: boolean
  isLoadingMessages: boolean
  isSending: boolean
  error: string | null
  
  // Actions
  setSelectedSession: (sessionId: string | null) => void
  fetchChats: (sessionId: string) => Promise<void>
  fetchMessages: (sessionId: string, chatId: string) => Promise<void>
  sendMessage: (sessionId: string, data: SendMessageRequest) => Promise<void>
  setSelectedChat: (chat: Chat | null) => void
  clearError: () => void
}

export const useChatsStore = create<ChatsState>((set, get) => ({
  chats: [],
  messages: [],
  selectedChat: null,
  selectedSession: null,
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,

  setSelectedSession: (sessionId: string | null) => {
    set({ selectedSession: sessionId, selectedChat: null, chats: [], messages: [] })
  },

  fetchChats: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await chatsAPI.getList(sessionId)
      const chatData = response.data.data || []
      
      // Transform API response to Chat format
      const chats: Chat[] = chatData.map((chat: any) => ({
        id: chat.id,
        name: chat.name || chat.id,
        unreadCount: chat.unreadCount || 0,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        isGroup: chat.id.includes('@g.us')
      }))
      
      set({ chats, isLoading: false })
    } catch (error) {
      set({ 
        error: getErrorMessage(error),
        isLoading: false 
      })
    }
  },

  fetchMessages: async (sessionId: string, chatId: string) => {
    try {
      set({ isLoadingMessages: true, error: null })
      
      // Usar baileysAPI que tiene el método getConversation
      const response = await baileysAPI.getConversation(
        sessionId,
        chatId,
        50,
        chatId.includes('@g.us')
      )
      
      const messages: Message[] = response.data.data || []
      
      set({ messages, isLoadingMessages: false })
    } catch (error) {
      set({ 
        error: getErrorMessage(error),
        isLoadingMessages: false 
      })
    }
  },

  sendMessage: async (sessionId: string, data: SendMessageRequest) => {
    try {
      set({ isSending: true, error: null })
      
      await chatsAPI.sendMessage(sessionId, data)
      
      // Refresh messages after sending
      const { selectedChat } = get()
      if (selectedChat) {
        await get().fetchMessages(sessionId, selectedChat.id)
      }
      
      set({ isSending: false })
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ 
        error: errorMessage,
        isSending: false 
      })
      throw new Error(errorMessage)
    }
  },

  setSelectedChat: (chat: Chat | null) => {
    set({ selectedChat: chat, messages: [] })
  },

  clearError: () => set({ error: null }),
}))
