import { Session } from './types'
import { CheckCircle, XCircle, AlertCircle, Activity, Wifi, WifiOff } from '@/components/ui/icons'
import { getStatusColor, getStatusText } from './sessionUtils'

interface StatusIndicatorProps {
  session: Session;
}

export function StatusIndicator({ session }: StatusIndicatorProps) {
  const getStatusIcon = (status: string, authenticated: boolean = false) => {
    if (authenticated) {
      return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
    }
    
    switch (status) {
      case 'authenticated':
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
      case 'connected':
        return <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
      case 'connecting':
        return <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 animate-pulse flex-shrink-0" />
      case 'disconnected':
      case 'disconnecting':
        return <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
      case 'error':
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
      default:
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
    }
  }

  const icon = getStatusIcon(session.status, session.authenticated)
  const color = getStatusColor(session.status, session.authenticated)
  const text = getStatusText(session.status, session.authenticated)
  
  return (
    <div className="inline-flex items-center gap-1 sm:gap-2 flex-wrap">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`}></span>
      {icon}
      <span className="text-xs sm:text-sm font-medium truncate">{text}</span>
    </div>
  )
}
