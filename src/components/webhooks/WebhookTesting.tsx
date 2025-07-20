"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface WebhookTestingProps {
  webhookConfig: any;
  testing: boolean;
  testResult: any;
  onTest: (payload: string) => void;
}

export default function WebhookTesting({
  webhookConfig,
  testing,
  testResult,
  onTest
}: WebhookTestingProps) {
  const [testPayload, setTestPayload] = useState(`{
  "type": "test_notification",
  "data": {
    "message": "Prueba de webhook desde panel",
    "timestamp": "${new Date().toISOString()}",
    "source": "dashboard"
  }
}`);

  const handleTest = () => {
    onTest(testPayload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Play className="h-5 w-5 mr-2" />
          Pruebas de Webhook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Payload de Prueba</label>
          <Textarea
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            rows={8}
            className="font-mono text-sm"
            placeholder="JSON del webhook de prueba"
          />
        </div>

        <Button
          onClick={handleTest}
          disabled={!webhookConfig || testing}
          className="w-full"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Enviar Prueba
        </Button>

        {testResult && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {testResult.success ? "Prueba Exitosa" : "Prueba Fallida"}
                </span>
                {testResult.statusCode && (
                  <Badge variant="outline">
                    HTTP {testResult.statusCode}
                  </Badge>
                )}
              </div>

              {testResult.message && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700">
                    Respuesta:
                  </label>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}

              {testResult.error && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-700">
                    Error:
                  </label>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      {testResult.error}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                {testResult.timestamp && `Enviado: ${new Date(testResult.timestamp).toLocaleString()}`}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}