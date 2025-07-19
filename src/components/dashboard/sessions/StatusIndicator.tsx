import { Session } from './types'
import { CheckCircle, XCircle, AlertCircle, Activity, Wifi, WifiOff } from '@/components/ui/icons'
import { getStatusColor, getStatusText } from './sessionUtils'

interface StatusIndicatorProps {
  session: Session;
}

export function StatusIndicator({ session }: StatusIndicatorProps) {
  const getStatusIcon = (status: string, authenticated: boolean = false) => {
    if (authenticated) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    
    switch (status) {
      case 'authenticated':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'connected':
        return <Wifi className="h-4 w-4 text-blue-600" />
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />
      case 'disconnected':
      case 'disconnecting':
        return <WifiOff className="h-4 w-4 text-red-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const icon = getStatusIcon(session.status, session.authenticated)
  const color = getStatusColor(session.status, session.authenticated)
  const text = getStatusText(session.status, session.authenticated)
  
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color}`}></span>
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </span>
  )
}
