import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'pulse' | 'premium' | 'card'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  animate?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', rounded = 'md', animate = true, ...props }, ref) => {
    const variants = {
      default: 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
      gradient: 'bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
      pulse: 'bg-gray-200 dark:bg-gray-700',
      premium: 'bg-gradient-to-r from-gray-200 via-white to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
      card: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm'
    }

    const roundedStyles = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    }

    const animationClass = animate ? {
      default: 'animate-pulse',
      gradient: 'animate-pulse',
      pulse: 'animate-pulse',
      premium: 'animate-pulse',
      card: 'animate-pulse'
    }[variant] : ''

    return (
      <div
        ref={ref}
        className={cn(
          'block',
          variants[variant],
          roundedStyles[rounded],
          animate && animationClass,
          className
        )}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

// 🎨 SPECIALIZED SKELETON COMPONENTS
export const SkeletonCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4 border rounded-lg bg-white dark:bg-gray-800 space-y-3', className)} {...props}>
    {children}
  </div>
)

export const SkeletonText = ({ lines = 1, className, ...props }: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('space-y-2', className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
        )}
      />
    ))}
  </div>
)

export const SkeletonAvatar = ({ size = 'md', className, ...props }: { size?: 'sm' | 'md' | 'lg' } & React.HTMLAttributes<HTMLDivElement>) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }
  
  return (
    <Skeleton
      className={cn(sizes[size], 'rounded-full', className)}
      rounded="full"
      {...props}
    />
  )
}

export const SkeletonButton = ({ size = 'md', className, ...props }: { size?: 'sm' | 'md' | 'lg' } & React.HTMLAttributes<HTMLDivElement>) => {
  const sizes = {
    sm: 'h-8 px-3',
    md: 'h-10 px-4',
    lg: 'h-12 px-6'
  }
  
  return (
    <Skeleton
      className={cn(sizes[size], 'rounded-md', className)}
      {...props}
    />
  )
}

export const SkeletonTable = ({ rows = 5, cols = 4, className, ...props }: { rows?: number, cols?: number } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('space-y-3', className)} {...props}>
    {/* Header */}
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 bg-gray-300" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4" />
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonChart = ({ height = 'h-64', className, ...props }: { height?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative overflow-hidden', className)} {...props}>
    <Skeleton 
      className={cn(height, 'w-full bg-gradient-to-br from-gray-100 to-gray-200')} 
      variant="gradient" 
    />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="space-y-3 text-center">
        <SkeletonAvatar size="lg" className="mx-auto opacity-50" />
        <Skeleton className="h-4 w-32 bg-gray-300 mx-auto" />
      </div>
    </div>
  </div>
)

export { Skeleton }