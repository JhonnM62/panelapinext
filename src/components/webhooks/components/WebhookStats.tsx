"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  AlertTriangle,
  Activity,
  Webhook,
  Users,
} from "lucide-react";

interface WebhookStats {
  totalNotifications: number;
  unreadNotifications: number;
  webhookActive: boolean;
  lastNotification: string | null;
  connectedClients: number;
}

interface ResourceLimits {
  webhooks: {
    current: number;
    limit: number;
    remaining: number;
  };
}

interface WebhookStatsProps {
  stats: WebhookStats | null;
  resourceLimits: ResourceLimits | null;
  webhookConfigs: any[];
  isConnected: boolean;
}

export default function WebhookStatsCards({
  stats,
  resourceLimits,
  webhookConfigs,
  isConnected
}: WebhookStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 w-full">
      {/* Total Notificaciones */}
      <Card className="w-full">
        <CardContent className="flex flex-col items-center p-2 sm:p-3 text-center">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mb-1" />
          <p className="text-sm sm:text-lg font-bold">
            {stats?.totalNotifications || 0}
          </p>
          <p className="text-xs text-gray-600 leading-tight">
            Total
          </p>
        </CardContent>
      </Card>

      {/* Sin Leer */}
      <Card className="w-full">
        <CardContent className="flex flex-col items-center p-2 sm:p-3 text-center">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mb-1" />
          <p className="text-sm sm:text-lg font-bold">
            {stats?.unreadNotifications || 0}
          </p>
          <p className="text-xs text-gray-600 leading-tight">Sin Leer</p>
        </CardContent>
      </Card>

      {/* Estado WebSocket */}
      <Card className="w-full">
        <CardContent className="flex flex-col items-center p-2 sm:p-3 text-center">
          <Activity
            className={`h-4 w-4 sm:h-5 sm:w-5 mb-1 ${
              isConnected ? "text-green-600" : "text-red-600"
            }`}
          />
          <p className="text-xs sm:text-sm font-bold">
            {isConnected ? "ON" : "OFF"}
          </p>
          <p className="text-xs text-gray-600 leading-tight">Estado</p>
        </CardContent>
      </Card>

      {/* Webhooks Creados */}
      <Card className="w-full">
        <CardContent className="flex flex-col items-center p-2 sm:p-3 text-center">
          <Webhook className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mb-1" />
          <p className="text-sm sm:text-lg font-bold">
            {webhookConfigs.length}
          </p>
          <p className="text-xs text-gray-600 leading-tight">Creados</p>
        </CardContent>
      </Card>

      {/* Disponibles */}
      <Card className="w-full">
        <CardContent className="flex flex-col items-center p-2 sm:p-3 text-center">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mb-1" />
          <p className="text-sm sm:text-lg font-bold">
            {resourceLimits?.webhooks.remaining || 0}
          </p>
          <p className="text-xs text-gray-600 leading-tight">
            Disponibles
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function WebhookPlanStatus({ resourceLimits }: { resourceLimits: ResourceLimits | null }) {
  if (!resourceLimits) return null;

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">Estado del Plan:</span>
        <Badge variant="outline">
          {resourceLimits.webhooks.current}/{resourceLimits.webhooks.limit} webhooks utilizados
        </Badge>
        {resourceLimits.webhooks.remaining === 0 && (
          <Badge variant="destructive" className="ml-2">
            Límite alcanzado
          </Badge>
        )}
      </div>
    </div>
  );
}
