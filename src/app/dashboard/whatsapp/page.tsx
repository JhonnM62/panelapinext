"use client";

import { Suspense } from "react";
import { WhatsAppDashboard } from "@/components/whatsapp";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

function WhatsAppPageContent() {
  return <WhatsAppDashboard />;
}

// 🎨 WHATSAPP SKELETON COMPONENT
function WhatsAppSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-200 to-emerald-200" />
            <Skeleton className="h-8 w-72 bg-gradient-to-r from-green-200 to-emerald-200" />
          </div>
          <Skeleton className="h-4 w-96 bg-gray-200" />
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 bg-gradient-to-r from-blue-200 to-purple-200" />
          <Skeleton className="h-10 w-40 bg-green-200" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 bg-gray-300" />
                <Skeleton className="h-5 w-5 rounded bg-gradient-to-br from-green-200 to-emerald-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-8 w-16 bg-gradient-to-r from-gray-300 to-gray-400" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-3 w-3 bg-green-200" />
                  <Skeleton className="h-3 w-20 bg-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 bg-gray-300" />
                  <Skeleton className="h-4 w-64 bg-gray-200" />
                </div>
                <Skeleton className="h-8 w-32 bg-green-200" />
              </div>
            </CardHeader>
            <CardContent>
              {/* Sessions List Skeleton */}
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full bg-gradient-to-br from-green-200 to-emerald-200" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-gray-300" />
                        <Skeleton className="h-3 w-24 bg-gray-200" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-6 w-20 bg-green-200 rounded-full" />
                      <div className="flex space-x-1">
                        <Skeleton className="h-8 w-8 bg-blue-200" />
                        <Skeleton className="h-8 w-8 bg-green-200" />
                        <Skeleton className="h-8 w-8 bg-red-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* QR Code Area */}
              <div className="mt-6 p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
                <Skeleton className="h-32 w-32 bg-gray-200 mx-auto mb-4" />
                <Skeleton className="h-4 w-48 bg-gray-300 mx-auto mb-2" />
                <Skeleton className="h-3 w-36 bg-gray-200 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded-full bg-green-200" />
                <Skeleton className="h-6 w-32 bg-gray-300" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 bg-gray-300" />
                  <Skeleton className="h-4 w-16 bg-gray-200" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28 bg-gray-300" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-10 w-full bg-gradient-to-r from-green-200 to-emerald-200"
                />
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36 bg-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-6 w-6 rounded-full bg-green-200 mt-1" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-full bg-gray-300" />
                      <Skeleton className="h-3 w-2/3 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense fallback={<WhatsAppSkeleton />}>
      <WhatsAppPageContent />
    </Suspense>
  );
}
