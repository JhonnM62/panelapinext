import React from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  title?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Cargando...', 
  size = 'md',
  isLoading = true,
  title,
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  if (!isLoading) return null

  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <RefreshCw className={`${sizeClasses[size]} animate-spin mr-2`} />
      <span className="text-muted-foreground">{title || message}</span>
    </div>
  )
}

export default LoadingState