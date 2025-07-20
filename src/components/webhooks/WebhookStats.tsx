"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Activity, Webhook, Users } from "lucide-react";

interface WebhookStatsProps {
  stats: {
    totalNotifications: number;
    unreadNotifications: number;
    webhookActive: boolean;
    lastNotification: string | null;
    connectedClients: number;
  } | null;
  wsConnected: boolean;
}

export default function WebhookStats({ stats, wsConnected }: WebhookStatsProps) {
  const statItems = [
    {
      icon: Bell,
      value: stats?.totalNotifications || 0,
      label: "Total Notificaciones",
      color: "text-blue-600"
    },
    {
      icon: AlertTriangle,
      value: stats?.unreadNotifications || 0,
      label: "Sin Leer",
      color: "text-orange-600"
    },
    {
      icon: Activity,
      value: wsConnected ? "Conectado" : "Desconectado",
      label: "WebSocket",
      color: wsConnected ? "text-green-600" : "text-red-600"
    },
    {
      icon: Webhook,
      value: stats?.webhookActive ? "Activo" : "Inactivo",
      label: "Webhook",
      color: stats?.webhookActive ? "text-green-600" : "text-gray-600"
    },
    {
      icon: Users,
      value: stats?.connectedClients || 0,
      label: "Clientes Conectados",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="flex items-center p-4">
            <item.icon className={`h-6 w-6 flex-shrink-0 ${item.color}`} />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{item.value}</p>
              <p className="text-xs text-gray-600 truncate">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}