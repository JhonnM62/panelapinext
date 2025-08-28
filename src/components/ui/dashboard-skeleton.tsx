'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Componente de skeleton para simular elementos de carga
function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={cn(
      "animate-pulse bg-gray-200 dark:bg-gray-700 rounded",
      className
    )} />
  )
}

// Skeleton para la sidebar
function SidebarSkeleton() {
  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Header del sidebar */}
        <div className="flex items-center flex-shrink-0 px-4 py-6">
          <SkeletonBox className="h-8 w-32" />
        </div>
        
        {/* Navigation items */}
        <nav className="flex-1 px-2 pb-4 space-y-1">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="flex items-center px-2 py-2 text-sm font-medium rounded-md">
              <SkeletonBox className="h-5 w-5 mr-3" />
              <SkeletonBox className="h-4 w-24" />
            </div>
          ))}
        </nav>
        
        {/* User section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <SkeletonBox className="h-10 w-10 rounded-full" />
            <div className="ml-3">
              <SkeletonBox className="h-4 w-20 mb-1" />
              <SkeletonBox className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton para el header principal
function HeaderSkeleton() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <SkeletonBox className="h-8 w-8 rounded-lg" />
        </div>
        
        {/* Page title */}
        <SkeletonBox className="h-6 w-40" />
        
        {/* Right section */}
        <div className="flex items-center gap-2 lg:gap-4">
          <SkeletonBox className="h-8 w-24 rounded-full" />
          <SkeletonBox className="h-8 w-8 rounded-lg" />
          <SkeletonBox className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </header>
  )
}

// Skeleton para las tarjetas de estadísticas
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-20" />
                <SkeletonBox className="h-8 w-16" />
              </div>
              <SkeletonBox className="h-12 w-12 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Skeleton para gráficos y contenido principal
function MainContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <StatsCardsSkeleton />
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <SkeletonBox className="h-6 w-32" />
              <SkeletonBox className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <SkeletonBox className="h-6 w-28" />
              <SkeletonBox className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent activity */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <SkeletonBox className="h-6 w-36" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <SkeletonBox className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBox className="h-4 w-3/4" />
                    <SkeletonBox className="h-3 w-1/2" />
                  </div>
                  <SkeletonBox className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal del skeleton del dashboard
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar skeleton */}
      <SidebarSkeleton />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Header skeleton */}
        <HeaderSkeleton />
        
        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6">
          <MainContentSkeleton />
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      <div className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75 animate-pulse" />
    </div>
  )
}

export default DashboardSkeleton