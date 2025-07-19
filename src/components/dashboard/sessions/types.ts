export interface SessionData {
  id: string;
  status: string;
  authenticated?: boolean;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActivity?: string;
  qr?: string;
  code?: string;
  typeAuth?: 'qr' | 'code';
}

export interface WebhookStats {
  totalNotifications: number;
  unreadNotifications: number;
  webhookActive: boolean;
  lastNotification: string | null;
  connectedClients: number;
}

export interface Session extends SessionData {
  webhookId?: string
  webhookStats?: WebhookStats
  lastActivity?: string
  messageCount?: number
  chatCount?: number
}

export interface QRCodeData {
  sessionId: string;
  sessionName: string;
  qrCode: string;
  phoneNumber?: string;
}

export interface SessionFormData {
  sessionName: string;
  authType: 'qr' | 'code';
  phoneNumber: string;
  webhookUrl: string;
}

export interface VerificationData {
  code: string | null;
  sessionId: string | null;
  sessionName: string | null;
  phoneNumber: string | null;
  expiryTime: number | null;
  timeRemaining: number;
  copied: boolean;
  requesting: boolean;
}

export interface SessionState {
  sessions: Session[];
  loading: boolean;
  creating: boolean;
  refreshing: string | null;
  selectedSessions: string[];
  selectAllMode: boolean;
  bulkDeleting: boolean;
  cleaningInactive: boolean;
}
