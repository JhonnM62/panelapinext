// 🎨 SKELETON COMPONENTS - Colección unificada de skeletons para todo el proyecto
// Estos componentes proporcionan una experiencia de carga consistente y visualmente atractiva

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// 🔄 Animation Variants
const shimmerAnimation = {
  animation: 'shimmer 2s ease-in-out infinite',
  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
  backgroundSize: '200% 100%',
}

// 📊 Dashboard Page Skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-in fade-in-0 duration-500">
    {/* Header Skeleton */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-72 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
          <Skeleton className="h-5 w-96 bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <Skeleton className="h-11 w-40 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 rounded-lg" />
        </div>
      </div>
    </div>

    {/* Stats Cards Grid */}
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="relative overflow-hidden border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-8 w-20 bg-gray-300 dark:bg-gray-700" />
                <Skeleton className="h-3 w-32 bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 opacity-50" style={shimmerAnimation} />
        </Card>
      ))}
    </div>

    {/* Quick Actions Grid */}
    <div className="space-y-4">
      <Skeleton className="h-7 w-48 bg-gray-300 dark:bg-gray-700" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-28 bg-gray-300 dark:bg-gray-700" />
                  <Skeleton className="h-3 w-36 bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Recent Activity */}
    <div className="space-y-4">
      <Skeleton className="h-7 w-40 bg-gray-300 dark:bg-gray-700" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-200 to-blue-200 dark:from-green-900 dark:to-blue-900" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-56 bg-gray-300 dark:bg-gray-700" />
                  <Skeleton className="h-3 w-40 bg-gray-200 dark:bg-gray-800" />
                </div>
                <Skeleton className="h-6 w-16 bg-gray-200 dark:bg-gray-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
)

// 📱 Sessions Page Skeleton
export const SessionsSkeleton = () => (
  <div className="space-y-6 animate-in fade-in-0 duration-500">
    {/* Header */}
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded bg-gray-300 dark:bg-gray-700" />
              <Skeleton className="h-8 w-80 bg-gray-300 dark:bg-gray-700" />
            </div>
            <Skeleton className="h-5 w-64 bg-gray-200 dark:bg-gray-800" />
          </div>
          <Skeleton className="h-11 w-36 bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-900 dark:to-blue-800 rounded-lg" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-8 w-16 bg-gray-300 dark:bg-gray-700" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-48 bg-gray-300 dark:bg-gray-700" />
                    <Skeleton className="h-3 w-3 rounded-full bg-gray-400 dark:bg-gray-600" />
                    <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-gray-800" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Skeleton className="h-4 w-36 bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-800" />
                    <Skeleton className="h-4 w-28 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Skeleton className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-800" />
                  <Skeleton className="h-9 w-9 rounded-lg bg-red-200 dark:bg-red-900" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)

// 🤖 Templates/Bots Page Skeleton
export const TemplatesSkeleton = () => (
  <div className="space-y-6 animate-in fade-in-0 duration-500">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 bg-gray-300 dark:bg-gray-700" />
        <Skeleton className="h-5 w-80 bg-gray-200 dark:bg-gray-800" />
      </div>
      <Skeleton className="h-11 w-40 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-lg" />
    </div>

    {/* Tabs */}
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
      ))}
    </div>

    {/* Templates Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-40 bg-gray-300 dark:bg-gray-700" />
                <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-20 w-full bg-gray-100 dark:bg-gray-900 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <Skeleton className="h-9 w-20 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

// 🔗 Webhooks Page Skeleton
export const WebhooksSkeleton = () => (
  <div className="space-y-6 animate-in fade-in-0 duration-500">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56 bg-gray-300 dark:bg-gray-700" />
        <Skeleton className="h-5 w-72 bg-gray-200 dark:bg-gray-800" />
      </div>
      <Skeleton className="h-11 w-44 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-900 dark:to-emerald-900 rounded-lg" />
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-8 w-20 bg-gray-300 dark:bg-gray-700" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-200 to-emerald-200 dark:from-green-900 dark:to-emerald-900" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Webhooks List */}
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-48 bg-gray-300 dark:bg-gray-700" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-32 bg-gray-300 dark:bg-gray-700" />
                  <Skeleton className="h-5 w-20 bg-green-200 dark:bg-green-900 rounded-full" />
                </div>
                <Skeleton className="h-4 w-80 bg-gray-200 dark:bg-gray-800" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-gray-800" />
                  <Skeleton className="h-3 w-32 bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
                <Skeleton className="h-9 w-9 rounded-lg bg-red-200 dark:bg-red-900" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
)

// 📊 Analytics Page Skeleton
export const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-in fade-in-0 duration-500">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-10 w-64 bg-gray-300 dark:bg-gray-700" />
      <Skeleton className="h-5 w-80 bg-gray-200 dark:bg-gray-800" />
    </div>

    {/* Date Range Selector */}
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-48 rounded-lg bg-gray-200 dark:bg-gray-800" />
      <Skeleton className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 bg-gray-200 dark:bg-gray-800" />
              <Skeleton className="h-10 w-24 bg-gray-300 dark:bg-gray-700" />
              <Skeleton className="h-3 w-20 bg-gray-200 dark:bg-gray-800" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-gray-300 dark:bg-gray-700" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Table */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40 bg-gray-300 dark:bg-gray-700" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 pb-3 border-b">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-24 bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
          {/* Table Rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 py-2">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-28 bg-gray-200 dark:bg-gray-800" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)

// 📝 Generic Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-3 animate-in fade-in-0 duration-500">
    {/* Header */}
    <div className="grid gap-4 pb-3 border-b border-gray-200 dark:border-gray-700" 
         style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {[...Array(cols)].map((_, i) => (
        <Skeleton key={i} className="h-4 w-full max-w-[120px] bg-gray-300 dark:bg-gray-700" />
      ))}
    </div>
    {/* Rows */}
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="grid gap-4 py-2" 
           style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {[...Array(cols)].map((_, j) => (
          <Skeleton key={j} className="h-4 w-full max-w-[140px] bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    ))}
  </div>
)

// 🎯 Generic Card Skeleton
export const CardSkeleton = ({ showHeader = true }: { showHeader?: boolean }) => (
  <Card className="relative overflow-hidden animate-in fade-in-0 duration-500">
    {showHeader && (
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-gray-300 dark:bg-gray-700" />
          <Skeleton className="h-4 w-64 bg-gray-200 dark:bg-gray-800" />
        </div>
      </CardHeader>
    )}
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-lg" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </CardContent>
    <div className="absolute inset-0 opacity-30" style={shimmerAnimation} />
  </Card>
)

// 📋 Form Skeleton
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-6 animate-in fade-in-0 duration-500">
    {[...Array(fields)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-32 bg-gray-300 dark:bg-gray-700" />
        <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <Skeleton className="h-11 w-32 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 rounded-lg" />
      <Skeleton className="h-11 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
  </div>
)

// 🔍 Search Results Skeleton
export const SearchResultsSkeleton = () => (
  <div className="space-y-4 animate-in fade-in-0 duration-500">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-4 border rounded-lg border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <Skeleton className="h-5 w-64 bg-gray-300 dark:bg-gray-700" />
          <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800" />
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-gray-800" />
            <Skeleton className="h-3 w-32 bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// 🎬 Export All
export default {
  DashboardSkeleton,
  SessionsSkeleton,
  TemplatesSkeleton,
  WebhooksSkeleton,
  AnalyticsSkeleton,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  SearchResultsSkeleton,
}
