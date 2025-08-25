// Exportar todos los componentes de WhatsApp
export { SessionManager } from './SessionManager'
export { MessageSender } from './MessageSender'
export { ChatList } from './ChatList'
export { WhatsAppDashboard } from './WhatsAppDashboard'

// Tipos locales para uso externo (definidos aquí hasta que se implementen en @/lib/api)
export interface SessionData {
  id: string;
  status: string;
  authenticated: boolean;
  phoneNumber?: string | null;
  nombresesion?: string | null;
}

export interface MessageBase {
  id: string;
  remoteJid: string;
  fromMe: boolean;
  timestamp: number;
}

export interface TextMessage extends MessageBase {
  type: 'text';
  text: string;
}

export interface ImageMessage extends MessageBase {
  type: 'image';
  caption?: string;
  imageUrl?: string;
}

export interface AudioMessage extends MessageBase {
  type: 'audio';
  audioUrl?: string;
  ptt?: boolean;
}

export interface VideoMessage extends MessageBase {
  type: 'video';
  caption?: string;
  videoUrl?: string;
}

export interface DocumentMessage extends MessageBase {
  type: 'document';
  caption?: string;
  documentUrl?: string;
  fileName?: string;
  mimetype?: string;
}

export interface LocationMessage extends MessageBase {
  type: 'location';
  latitude: number;
  longitude: number;
}

export interface PollMessage extends MessageBase {
  type: 'poll';
  name: string;
  values: string[];
  selectableCount?: number;
}

export interface ReactionMessage extends MessageBase {
  type: 'reaction';
  emoji: string;
  targetMessageId: string;
}

export interface GroupData {
  id: string;
  subject: string;
  participants: string[];
  owner?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
