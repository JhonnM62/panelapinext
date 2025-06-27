// Exportar todos los componentes de WhatsApp
export { SessionManager } from './SessionManager'
export { MessageSender } from './MessageSender'
export { ChatList } from './ChatList'
export { WhatsAppDashboard } from './WhatsAppDashboard'

// Tipos para uso externo
export type {
  SessionData,
  MessageBase,
  TextMessage,
  ImageMessage,
  AudioMessage,
  VideoMessage,
  DocumentMessage,
  LocationMessage,
  PollMessage,
  ReactionMessage,
  GroupData,
  ApiResponse
} from '@/lib/api'
