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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Code,
} from "lucide-react";

interface WebhookConfig {
  userId: string;
  sessionId: string;
  webhookId: string;
  webhookUrl: string;
  clientWebhookUrl?: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
  statusCode?: number;
  payload?: any;
}

interface WebhookTestProps {
  webhookConfigs: WebhookConfig[];
  testing: boolean;
  testResult: TestResult | null;
  onTest: (webhook: WebhookConfig, payload: any) => void;
}

const defaultTestPayloads = {
  message: {
    type: "test_notification",
    data: {
      message: "Webhook de prueba desde el panel de control",
      timestamp: new Date().toISOString(),
      source: "dashboard",
      testId: crypto.randomUUID(),
    },
  },
  messageUpsert: {
    type: "MESSAGES_UPSERT",
    data: [
      {
        key: {
          remoteJid: "1234567890@s.whatsapp.net",
          fromMe: false,
          id: "test_message_123",
        },
        message: {
          conversation: "Este es un mensaje de prueba del webhook",
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        status: "PENDING",
      },
    ],
  },
  connectionUpdate: {
    type: "CONNECTION_UPDATE",
    data: {
      connection: "open",
      lastDisconnect: null,
      qr: null,
      receivedPendingNotifications: false,
    },
  },
};

export default function WebhookTest({
  webhookConfigs,
  testing,
  testResult,
  onTest
}: WebhookTestProps) {
  const [customPayload, setCustomPayload] = useState("");
  const [selectedPayloadType, setSelectedPayloadType] = useState<keyof typeof defaultTestPayloads>("message");

  const getCurrentPayload = () => {
    if (customPayload.trim()) {
      try {
        return JSON.parse(customPayload);
      } catch (error) {
        throw new Error("JSON inválido en el payload personalizado");
      }
    }
    return defaultTestPayloads[selectedPayloadType];
  };

  const handleTest = (webhook: WebhookConfig) => {
    try {
      const payload = getCurrentPayload();
      onTest(webhook, payload);
    } catch (error: any) {
      // El error será manejado por el componente padre
      onTest(webhook, null);
    }
  };

  const setPresetPayload = (type: keyof typeof defaultTestPayloads) => {
    setSelectedPayloadType(type);
    setCustomPayload(JSON.stringify(defaultTestPayloads[type], null, 2));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Play className="h-5 w-5 mr-2" />
          Probar Webhooks
        </CardTitle>
        <CardDescription>
          Envía un webhook de prueba para verificar la configuración
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {webhookConfigs.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No hay webhooks configurados para probar
            </p>
          </div>
        ) : (
          <>
            {/* Payload preconfigurados */}
            <div>
              <Label>Payloads de Prueba Predefinidos</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={selectedPayloadType === "message" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPresetPayload("message")}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Mensaje Simple
                </Button>
                <Button
                  variant={selectedPayloadType === "messageUpsert" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPresetPayload("messageUpsert")}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Mensaje WhatsApp
                </Button>
                <Button
                  variant={selectedPayloadType === "connectionUpdate" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPresetPayload("connectionUpdate")}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Conexión
                </Button>
              </div>
            </div>

            {/* Payload personalizado */}
            <div>
              <Label>Payload Personalizado (JSON)</Label>
              <Textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder={JSON.stringify(defaultTestPayloads.message, null, 2)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deja vacío para usar el payload predefinido seleccionado arriba
              </p>
            </div>

            {/* Lista de webhooks para probar */}
            <div className="space-y-2">
              <Label>Webhooks Disponibles para Prueba</Label>
              <div className="grid grid-cols-1 gap-2">
                {webhookConfigs.map((webhook) => (
                  <div
                    key={webhook.webhookId}
                    className={`p-3 rounded-lg border ${
                      webhook.active 
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" 
                        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">
                            Webhook - {webhook.sessionId}
                          </h4>
                          <div className={`w-2 h-2 rounded-full ${
                            webhook.active ? "bg-green-500" : "bg-gray-400"
                          }`} />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Eventos: {webhook.events.join(", ")}
                        </p>
                        {webhook.clientWebhookUrl && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            URL Externa: {webhook.clientWebhookUrl}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant={webhook.active ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTest(webhook)}
                        disabled={testing || !webhook.active}
                      >
                        {testing ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        {webhook.active ? "Probar" : "Inactivo"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resultado de la prueba */}
            {testResult && (
              <div className="mt-6">
                <Label>Resultado de la Prueba</Label>
                <div className={`mt-2 p-4 rounded-lg border ${
                  testResult.success 
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" 
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {testResult.success ? "Prueba Exitosa" : "Prueba Fallida"}
                    </span>
                    {testResult.statusCode && (
                      <span className="text-sm text-gray-600">
                        (Código: {testResult.statusCode})
                      </span>
                    )}
                  </div>
                  
                  {testResult.message && (
                    <p className="text-sm mb-2">{testResult.message}</p>
                  )}
                  
                  {testResult.error && (
                    <p className="text-sm text-red-600 mb-2">{testResult.error}</p>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Ejecutado: {new Date(testResult.timestamp).toLocaleString()}
                  </p>
                  
                  {/* Mostrar payload enviado */}
                  {testResult.payload && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium cursor-pointer flex items-center gap-1">
                        <Code className="h-4 w-4" />
                        Ver Payload Enviado
                      </summary>
                      <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded border mt-2 overflow-auto max-h-40">
                        {JSON.stringify(testResult.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Información de ayuda */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Code className="h-4 w-4" />
                💡 Tips para las Pruebas
              </h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• <strong>Mensaje Simple:</strong> Prueba básica de conectividad</li>
                <li>• <strong>Mensaje WhatsApp:</strong> Simula un mensaje real de WhatsApp</li>
                <li>• <strong>Conexión:</strong> Simula cambios de estado de conexión</li>
                <li>• Los webhooks inactivos no pueden ser probados</li>
                <li>• Si tienes una URL externa configurada, también recibirá la prueba</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
