import React from 'react'
import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'error' | 'pending'
  label?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const variants = {
    active: { variant: 'default' as const, text: label || 'Activo' },
    inactive: { variant: 'secondary' as const, text: label || 'Inactivo' },
    error: { variant: 'destructive' as const, text: label || 'Error' },
    pending: { variant: 'outline' as const, text: label || 'Pendiente' }
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant}>
      {config.text}
    </Badge>
  )
}

export default StatusBadge