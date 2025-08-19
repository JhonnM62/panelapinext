"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  RefreshCw,
  CheckCircle,
  Activity,
} from "lucide-react";
import { WebhookPlanStatus } from "./WebhookStats";

interface WebhookConfig {
  userId: string;
  sessionId: string;
  webhookId: string;
  webhookUrl: string;
  clientWebhookUrl?: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface SessionOption {
  id: string;
  status: string;
  authenticated: boolean;
  phoneNumber?: string | null;
}

interface ResourceLimits {
  webhooks: {
    current: number;
    limit: number;
    remaining: number;
  };
}

interface WebhookFormProps {
  editingWebhook: WebhookConfig | null;
  sessions: SessionOption[];
  resourceLimits: ResourceLimits | null;
  creating: boolean;
  editing: boolean;
  onSubmit: (formData: {
    selectedSessionId: string;
    clientWebhookUrl: string;
    selectedEvents: string[];
    webhookActive: boolean;
  }) => void;
  onCancel: () => void;
}

// Available events from Baileys API - optimizado para tipos de mensaje
const availableEvents = [
  "ALL", // Todos los eventos
  "MESSAGES_UPSERT", // 📩 SOLO MENSAJES ENTRANTES (recomendado para chatbots)
  "MESSAGES_DELETE",
  "MESSAGES_UPDATE",
  "MESSAGES_RECEIPT_UPDATE",
  "MESSAGES_REACTION",
  "CONNECTION_UPDATE",
  "CHATS_SET",
  "CHATS_UPSERT",
  "CHATS_DELETE",
  "CHATS_UPDATE",
  "CONTACTS_SET",
  "CONTACTS_UPSERT",
  "CONTACTS_UPDATE",
  "GROUPS_UPSERT",
  "GROUPS_UPDATE",
  "GROUP_PARTICIPANTS_UPDATE",
  "PRESENCE_UPDATE",
];

export default function WebhookForm({
  editingWebhook,
  sessions,
  resourceLimits,
  creating,
  editing,
  onSubmit,
  onCancel
}: WebhookFormProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(
    editingWebhook?.sessionId || ""
  );
  const [clientWebhookUrl, setClientWebhookUrl] = useState(
    editingWebhook?.clientWebhookUrl || ""
  );
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    editingWebhook?.events || ["MESSAGES_UPSERT"]
  );
  const [webhookActive, setWebhookActive] = useState(
    editingWebhook?.active ?? true
  );

  const handleEventToggle = (event: string) => {
    if (event === "ALL") {
      setSelectedEvents(["ALL"]);
    } else {
      setSelectedEvents((prev) => {
        const filtered = prev.filter((e) => e !== "ALL");
        if (filtered.includes(event)) {
          const newEvents = filtered.filter((e) => e !== event);
          return newEvents.length === 0 ? ["ALL"] : newEvents;
        } else {
          return [...filtered, event];
        }
      });
    }
  };

  const handleSubmit = () => {
    onSubmit({
      selectedSessionId,
      clientWebhookUrl,
      selectedEvents,
      webhookActive
    });
  };

  const canSubmit = editingWebhook ? true : selectedSessionId.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          {editingWebhook ? "Editar Webhook" : "Crear Nuevo Webhook"}
        </CardTitle>
        <CardDescription>
          {editingWebhook 
            ? "Modifica la configuración de tu webhook existente"
            : "Configura un webhook para recibir notificaciones en tiempo real"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mostrar límites del plan */}
        <WebhookPlanStatus resourceLimits={resourceLimits} />

        {/* Sesión de WhatsApp */}
        <div>
          <Label>Sesión de WhatsApp</Label>
          <Select 
            value={selectedSessionId} 
            onValueChange={setSelectedSessionId}
            disabled={!!editingWebhook}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una sesión" />
            </SelectTrigger>
            <SelectContent>
              {sessions.filter(s => s.authenticated).map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{session.id}</span>
                    {session.phoneNumber && (
                      <Badge variant="secondary" className="text-xs">
                        {session.phoneNumber}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sessions.filter(s => s.authenticated).length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              ⚠️ No hay sesiones autenticadas disponibles. Ve a "Sesiones" para conectar una sesión de WhatsApp primero.
            </p>
          )}
          {sessions.length > 0 && sessions.filter(s => s.authenticated).length === 0 && (
            <p className="text-sm text-blue-600 mt-1">
              📱 Tienes {sessions.length} sesiones configuradas, pero ninguna está autenticada. 
              Conecta una sesión para poder crear webhooks.
            </p>
          )}
        </div>

        {/* URL Cliente (Opcional) */}
        <div>
          <Label>URL Cliente (Opcional)</Label>
          <Input
            value={clientWebhookUrl}
            onChange={(e) => setClientWebhookUrl(e.target.value)}
            placeholder="https://tu-servidor.com/webhook"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL donde se enviarán las notificaciones. Deja vacío para usar solo el panel web.
          </p>
        </div>

        {/* Eventos a Escuchar */}
        <div>
          <Label>Eventos a Escuchar</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {availableEvents.map((event) => (
              <Button
                key={event}
                variant={selectedEvents.includes(event) ? "default" : "outline"}
                size="sm"
                onClick={() => handleEventToggle(event)}
                className="justify-start text-xs"
              >
                {event}
                {event === "MESSAGES_UPSERT" && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Recomendado
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 <strong>MESSAGES_UPSERT</strong> es el evento más usado para chatbots (mensajes entrantes)
          </p>
        </div>

        {/* Estado del Webhook (solo en edición) */}
        {editingWebhook && (
          <div className="flex items-center space-x-2">
            <Switch
              id="webhook-active"
              checked={webhookActive}
              onCheckedChange={setWebhookActive}
            />
            <Label htmlFor="webhook-active">Webhook Activo</Label>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={(creating || editing) || !canSubmit}
            className="flex-1"
          >
            {(creating || editing) ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {editingWebhook ? "Actualizando..." : "Creando..."}
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                {editingWebhook ? "Actualizar Webhook" : "Crear Webhook"}
              </>
            )}
          </Button>

          {editingWebhook && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={creating || editing}
            >
              Cancelar
            </Button>
          )}
        </div>

        {/* Información adicional */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
          <h4 className="font-medium mb-2">ℹ️ Información importante:</h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• Los webhooks reciben notificaciones en tiempo real</li>
            <li>• Puedes configurar una URL externa para enviar datos a tu servidor</li>
            <li>• El panel web siempre recibirá las notificaciones independientemente de la URL</li>
            <li>• Los eventos de tipo "ALL" incluyen todos los tipos disponibles</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
