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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Webhook,
  Plus,
  Edit,
  Play,
  Trash2,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  deliverySettings?: {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
  };
}

interface SessionOption {
  id: string;
  status: string;
  authenticated: boolean;
  phoneNumber?: string | null;
}

interface WebhookListProps {
  webhookConfigs: WebhookConfig[];
  sessions: SessionOption[];
  loading: boolean;
  deleting: boolean;
  testing: boolean;
  onEdit: (webhook: WebhookConfig) => void;
  onDelete: (webhookId: string) => void;
  onTest: (webhook: WebhookConfig) => void;
  onCreateNew: () => void;
}

export default function WebhookList({
  webhookConfigs,
  sessions,
  loading,
  deleting,
  testing,
  onEdit,
  onDelete,
  onTest,
  onCreateNew
}: WebhookListProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "📋 Copiado",
      description: "URL copiada al portapapeles",
    });
  };

  const handleDeleteClick = (webhookId: string) => {
    setWebhookToDelete(webhookId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (webhookToDelete) {
      onDelete(webhookToDelete);
      setShowDeleteDialog(false);
      setWebhookToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando webhooks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Webhooks Configurados ({webhookConfigs.length})
        </h3>
        <Button onClick={onCreateNew} size="lg" className="h-12 text-base font-medium">
          <Plus className="h-5 w-5 mr-2" />
          Crear Webhook
        </Button>
      </div>

      {webhookConfigs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay webhooks configurados
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Crea tu primer webhook para recibir notificaciones en tiempo real
            </p>
            <Button onClick={onCreateNew} size="lg" className="h-12 text-base font-medium">
              <Plus className="h-5 w-5 mr-2" />
              Crear Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
          {webhookConfigs.map((webhook) => (
            <Card key={webhook.webhookId} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-3">
                <div className="space-y-3">
                  {/* Header compacto */}
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">Webhook - {webhook.sessionId}</h4>
                      <p className="text-xs text-gray-600 truncate">
                        {sessions.find(s => s.id === webhook.sessionId)?.phoneNumber || 'Número no disponible'}
                      </p>
                    </div>
                    <Badge variant={webhook.active ? 'default' : 'secondary'} className="text-xs px-2 py-1 flex-shrink-0">
                      {webhook.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  {/* URL del Webhook */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">URL del Webhook</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={webhook.webhookUrl} 
                        disabled 
                        className="text-xs flex-1 h-8" 
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyWebhookUrl(webhook.webhookUrl)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* URL Cliente (si existe) */}
                  {webhook.clientWebhookUrl && (
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">URL Cliente</Label>
                      <Input 
                        value={webhook.clientWebhookUrl} 
                        disabled 
                        className="text-xs h-8" 
                      />
                    </div>
                  )}

                  {/* Eventos y Metadatos en una fila */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-500 mb-1 block">Eventos</Label>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 3).map((event) => (
                          <Badge key={event} variant="default" className="text-xs px-2 py-0">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            +{webhook.events.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">
                        {formatTimestamp(webhook.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(webhook)}
                      className="flex-1 h-9 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTest(webhook)}
                      disabled={testing}
                      className="flex-1 h-9 text-xs"
                    >
                      {testing ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Probar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(webhook.webhookId)}
                      className="flex-1 h-9 text-xs"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este webhook? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setWebhookToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
