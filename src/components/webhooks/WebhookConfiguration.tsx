"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Settings, Trash2, Edit, Loader2 } from "lucide-react";

interface WebhookConfigurationProps {
  sessions: any[];
  webhookConfig: any;
  selectedSessionId: string;
  selectedEvents: string[];
  clientWebhookUrl: string;
  creating: boolean;
  editing: boolean;
  deleting: boolean;
  onSessionChange: (sessionId: string) => void;
  onEventsChange: (events: string[]) => void;
  onUrlChange: (url: string) => void;
  onCreate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const availableEvents = [
  "ALL",
  "MESSAGES_UPSERT", 
  "MESSAGES_DELETE",
  "MESSAGES_UPDATE",
  "CONNECTION_UPDATE",
  "CHATS_UPSERT",
  "CONTACTS_UPSERT",
  "GROUPS_UPSERT"
];

export default function WebhookConfiguration({
  sessions,
  webhookConfig,
  selectedSessionId,
  selectedEvents,
  clientWebhookUrl,
  creating,
  editing,
  deleting,
  onSessionChange,
  onEventsChange,
  onUrlChange,
  onCreate,
  onEdit,
  onDelete
}: WebhookConfigurationProps) {
  const [editingEvents, setEditingEvents] = useState(false);

  const toggleEvent = (event: string) => {
    if (event === "ALL") {
      onEventsChange(["ALL"]);
    } else {
      const filtered = selectedEvents.filter(e => e !== "ALL");
      if (filtered.includes(event)) {
        const newEvents = filtered.filter(e => e !== event);
        onEventsChange(newEvents.length === 0 ? ["ALL"] : newEvents);
      } else {
        onEventsChange([...filtered, event]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuración de Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sesión de WhatsApp</Label>
            <Select value={selectedSessionId} onValueChange={onSessionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una sesión" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{session.id}</span>
                      {session.phone && (
                        <Badge variant="secondary" className="text-xs">
                          {session.phone}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>URL Cliente (Opcional)</Label>
            <Input
              value={clientWebhookUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://tu-servidor.com/webhook"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos a Escuchar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableEvents.map((event) => (
              <Button
                key={event}
                variant={selectedEvents.includes(event) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleEvent(event)}
                className="justify-start"
              >
                {event}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        {webhookConfig && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onEdit}
              disabled={editing}
            >
              {editing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Eliminar
            </Button>
          </div>
        )}

        {!webhookConfig && (
          <Button
            onClick={onCreate}
            disabled={creating || !selectedSessionId}
            className="ml-auto"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            Crear Webhook
          </Button>
        )}
      </div>
    </div>
  );
}