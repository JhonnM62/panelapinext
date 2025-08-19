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
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Total Notificaciones */}
      <Card>
        <CardContent className="flex items-center p-4">
          <Bell className="h-6 w-6 flex-shrink-0 text-blue-600" />
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-lg font-bold truncate">
              {stats?.totalNotifications || 0}
            </p>
            <p className="text-xs text-gray-600 truncate">
              Total Notificaciones
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sin Leer */}
      <Card>
        <CardContent className="flex items-center p-4">
          <AlertTriangle className="h-6 w-6 flex-shrink-0 text-orange-600" />
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-lg font-bold truncate">
              {stats?.unreadNotifications || 0}
            </p>
            <p className="text-xs text-gray-600 truncate">Sin Leer</p>
          </div>
        </CardContent>
      </Card>

      {/* Estado WebSocket */}
      <Card>
        <CardContent className="flex items-center p-4">
          <Activity
            className={`h-6 w-6 flex-shrink-0 ${
              isConnected ? "text-green-600" : "text-red-600"
            }`}
          />
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-lg font-bold truncate">
              {isConnected ? "Conectado" : "Desconectado"}
            </p>
            <p className="text-xs text-gray-600 truncate">WebSocket</p>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks Creados */}
      <Card>
        <CardContent className="flex items-center p-4">
          <Webhook className="h-6 w-6 flex-shrink-0 text-green-600" />
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-lg font-bold truncate">
              {webhookConfigs.length}
            </p>
            <p className="text-xs text-gray-600 truncate">Webhooks Creados</p>
          </div>
        </CardContent>
      </Card>

      {/* Disponibles */}
      <Card>
        <CardContent className="flex items-center p-4">
          <Users className="h-6 w-6 flex-shrink-0 text-purple-600" />
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-lg font-bold truncate">
              {resourceLimits?.webhooks.remaining || 0}
            </p>
            <p className="text-xs text-gray-600 truncate">
              Disponibles
            </p>
          </div>
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
