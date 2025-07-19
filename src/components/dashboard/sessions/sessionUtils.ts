import { Session } from './types'

export const mapBackendStatus = (backendStatus: string): string => {
  const statusMap: { [key: string]: string } = {
    'conectando': 'connecting',
    'connecting': 'connecting',
    'conectado': 'connected',
    'connected': 'connected',
    'autenticado': 'authenticated',
    'authenticated': 'authenticated',
    'desconectado': 'disconnected',
    'disconnected': 'disconnected',
    'desconectando': 'disconnecting',
    'disconnecting': 'disconnecting',
    'eliminada': 'deleted',
    'deleted': 'deleted',
    'error': 'error'
  }
  
  const mappedStatus = statusMap[backendStatus.toLowerCase()]
  return mappedStatus || backendStatus
}

export const getStatusColor = (status: string, authenticated: boolean = false): string => {
  if (authenticated) {
    return 'bg-green-500'
  }
  
  switch (status) {
    case 'authenticated':
      return 'bg-green-500'
    case 'connected':
      return 'bg-blue-500'
    case 'connecting':
      return 'bg-yellow-500 animate-pulse'
    case 'disconnected':
    case 'disconnecting':
      return 'bg-red-500'
    case 'error':
      return 'bg-red-600'
    default:
      return 'bg-gray-500'
  }
}

export const getStatusText = (status: string, authenticated: boolean = false): string => {
  if (authenticated) {
    return 'Autenticado'
  }
  
  switch (status) {
    case 'authenticated':
      return 'Autenticado'
    case 'connected':
      return 'Conectado'
    case 'connecting':
      return 'Conectando'
    case 'disconnected':
      return 'Desconectado'
    case 'disconnecting':
      return 'Desconectando'
    case 'error':
      return 'Error'
    default:
      return 'Desconocido'
  }
}

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^\+\d{1,3}\s?\d{3}\s?\d{3}\s?\d{4}$/
  return phoneRegex.test(phoneNumber.trim())
}

export const formatSessionId = (sessionId: string): string => {
  return sessionId.length > 20 ? sessionId.substring(0, 20) + '...' : sessionId
}

export const detectSessionDisappearance = (currentSessions: Session[], previousSessions: Session[]): Session[] => {
  const currentIds = new Set(currentSessions.map(s => s.id))
  const previousIds = new Set(previousSessions.map(s => s.id))
  
  return previousSessions.filter(session => 
    (session.status === 'authenticated' || session.status === 'connected') && 
    !currentIds.has(session.id)
  )
}

export const getInactiveSessions = (sessions: Session[]): Session[] => {
  return sessions.filter(s => s.status === 'disconnected' || s.status === 'error')
}

export const getAuthenticatedSessions = (sessions: Session[]): Session[] => {
  return sessions.filter(s => s.status === 'authenticated' || s.authenticated)
}

export const getConnectedSessions = (sessions: Session[]): Session[] => {
  return sessions.filter(s => s.status === 'connected')
}

export const getConnectingSessions = (sessions: Session[]): Session[] => {
  return sessions.filter(s => s.status === 'connecting')
}
