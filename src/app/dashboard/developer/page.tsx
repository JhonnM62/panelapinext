"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code2,
  BookOpen,
  Download,
  Copy,
  Play,
  FileText,
  Zap,
  Smartphone,
  MessageSquare,
  Users,
  Settings,
  ExternalLink,
  Terminal,
  Package,
  Globe,
  Key,
  Puzzle,
  Rocket,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
// import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

const API_BASE_URL = "https://backend.autosystemprojects.site";

// Ejemplos de código para diferentes lenguajes y plataformas
const codeExamples = {
  javascript: {
    appsheet: `// Integración con AppSheet - Enviar mensaje desde una app
// Este código se puede usar en AppSheet con la acción "Call a webhook"

const sendMessageFromApp = async (phoneNumber, message, botId) => {
  const response = await fetch('${API_BASE_URL}/chats/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': 'tu_token_aqui'
    },
    body: JSON.stringify({
      number: phoneNumber,
      message: message,
      sessionId: botId
    })
  });
  
  return await response.json();
};

// Ejemplo de uso en AppSheet:
// 1. Crear una acción "Call a webhook"
// 2. URL: tu-dominio.com/api/send-message
// 3. Método: POST
// 4. Headers: x-access-token con tu token
// 5. Body: datos del formulario AppSheet`,

    message: `// Enviar mensaje de texto
const sendMessage = async (sessionId, phoneNumber, message, token) => {
  try {
    const response = await axios.post(\`\${API_URL}/chats/send?id=\${sessionId}\`, {
      receiver: phoneNumber,
      isGroup: false,
      message: {
        text: message
      }
    }, {
      headers: {
        'x-access-token': token
      }
    })
    
    return response.data
  } catch (error) {
    console.error('Error enviando mensaje:', error)
  }
}

// Enviar mensaje con imagen
const sendImageMessage = async (sessionId, phoneNumber, imageUrl, caption, token) => {
  const response = await axios.post(\`\${API_URL}/chats/send?id=\${sessionId}\`, {
    receiver: phoneNumber,
    isGroup: false,
    message: {
      image: { url: imageUrl },
      caption: caption
    }
  }, {
    headers: { 'x-access-token': token }
  })
  
  return response.data
}`,

    webhook: `// Configurar Webhook para recibir mensajes
const createWebhook = async (userId, sessionId, webhookUrl) => {
  const response = await axios.post(\`\${API_URL}/webhook/create\`, {
    userId: userId,
    sessionId: sessionId,
    events: ['message.new', 'session.status', 'message.ack'],
    webhookUrl: webhookUrl
  })
  
  return response.data
}

// Express.js - Recibir webhooks
const express = require('express')
const app = express()

app.use(express.json())

app.post('/webhook', (req, res) => {
  const { type, data } = req.body
  
  switch (type) {
    case 'message.new':
      console.log('Nuevo mensaje:', data)
      // Procesar mensaje entrante
      break
    case 'session.status':
      console.log('Estado de sesión:', data)
      break
    case 'message.ack':
      console.log('Acuse de recibo:', data)
      break
  }
  
  res.status(200).send('OK')
})

app.listen(3000, () => {
  console.log('Webhook server running on port 3000')
})`,
  },

  python: {
    appsheet: `# Integración con AppSheet usando Python Flask
import requests
import json
from flask import Flask, request, jsonify

# Servidor Flask para integrar con AppSheet
app = Flask(__name__)

@app.route('/api/send-message', methods=['POST'])
def send_message_from_appsheet():
    """Endpoint para recibir datos de AppSheet y enviar mensajes"""
    try:
        # Obtener datos del formulario AppSheet
        data = request.json
        phone = data.get('phone')
        message = data.get('message')
        session_id = data.get('session_id')
        
        # Enviar mensaje usando la API
        url = "${API_BASE_URL}/chats/send"
        headers = {
            "Content-Type": "application/json",
            "x-access-token": "tu_token_aqui"
        }
        
        payload = {
            "number": phone,
            "message": message,
            "sessionId": session_id
        }
        
        response = requests.post(url, headers=headers, json=payload)
        result = response.json()
        
        return jsonify({"success": True, "data": result})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)`,

    message: `# Enviar mensajes con Python
def send_message(session_id, phone_number, message, token):
    url = f'{API_URL}/chats/send?id={session_id}'
    headers = {
        'Content-Type': 'application/json',
        'x-access-token': token
    }
    data = {
        'receiver': phone_number,
        'isGroup': False,
        'message': {
            'text': message
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()

# Enviar mensaje con imagen
def send_image_message(session_id, phone_number, image_url, caption, token):
    url = f'{API_URL}/chats/send?id={session_id}'
    headers = {
        'Content-Type': 'application/json',
        'x-access-token': token
    }
    data = {
        'receiver': phone_number,
        'isGroup': False,
        'message': {
            'image': {'url': image_url},
            'caption': caption
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()`,

    webhook: `# Flask webhook para recibir mensajes
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.get_json()
    event_type = data.get('type')
    event_data = data.get('data')
    
    if event_type == 'message.new':
        print(f'Nuevo mensaje: {event_data}')
        # Procesar mensaje entrante
    elif event_type == 'session.status':
        print(f'Estado de sesión: {event_data}')
    elif event_type == 'message.ack':
        print(f'Acuse de recibo: {event_data}')
    
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)`,
  },

  php: {
    appsheet: `<?php
// Integración con AppSheet usando PHP
// Endpoint para recibir webhooks de AppSheet

header('Content-Type: application/json');

// Función para enviar mensajes a través de la API
function sendMessageFromAppSheet($phone, $message, $sessionId) {
    $apiUrl = '${API_BASE_URL}/chats/send';
    $token = 'tu_token_aqui';
    
    $data = [
        'number' => $phone,
        'message' => $message,
        'sessionId' => $sessionId
    ];
    
    $options = [
        'http' => [
            'header' => [
                'Content-Type: application/json',
                'x-access-token: ' . $token
            ],
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($apiUrl, false, $context);
    
    return json_decode($result, true);
}

// Procesar datos de AppSheet
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $phone = $input['phone'] ?? '';
    $message = $input['message'] ?? '';
    $sessionId = $input['session_id'] ?? '';
    
    if ($phone && $message && $sessionId) {
        $result = sendMessageFromAppSheet($phone, $message, $sessionId);
        echo json_encode(['success' => true, 'data' => $result]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
}
?>`,

    message: `<?php
// Enviar mensaje con PHP
function sendMessage($sessionId, $phoneNumber, $message, $token) {
    $url = '${API_BASE_URL}/chats/send?id=' . $sessionId;
    $headers = [
        'Content-Type: application/json',
        'x-access-token: ' . $token
    ];
    $data = json_encode([
        'receiver' => $phoneNumber,
        'isGroup' => false,
        'message' => [
            'text' => $message
        ]
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Enviar imagen
function sendImageMessage($sessionId, $phoneNumber, $imageUrl, $caption, $token) {
    $url = '${API_BASE_URL}/chats/send?id=' . $sessionId;
    $data = json_encode([
        'receiver' => $phoneNumber,
        'isGroup' => false,
        'message' => [
            'image' => ['url' => $imageUrl],
            'caption' => $caption
        ]
    ]);
    
    // ... resto del código curl
}
?>`,

    webhook: `<?php
// Webhook receptor en PHP
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    $type = $data['type'] ?? '';
    $eventData = $data['data'] ?? [];
    
    switch ($type) {
        case 'message.new':
            error_log('Nuevo mensaje: ' . json_encode($eventData));
            // Procesar mensaje entrante
            break;
        case 'session.status':
            error_log('Estado de sesión: ' . json_encode($eventData));
            break;
        case 'message.ack':
            error_log('Acuse de recibo: ' . json_encode($eventData));
            break;
    }
    
    echo json_encode(['status' => 'ok']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>`,
  },
};

const quickStartGuides = [
  {
    title: "Guía Rápida - 5 minutos",
    description: "Conecta tu primera sesión WhatsApp",
    icon: Rocket,
    color: "bg-blue-500",
    steps: [
      "Obtén tu token de autenticación",
      "Crea una nueva sesión",
      "Escanea el código QR",
      "Envía tu primer mensaje",
      "Configura webhooks (opcional)",
    ],
  },
  {
    title: "Configurar Webhooks",
    description: "Recibe mensajes en tiempo real",
    icon: Zap,
    color: "bg-yellow-500",
    steps: [
      "Configura un endpoint público",
      "Registra el webhook en la API",
      "Procesa eventos entrantes",
      "Implementa manejo de errores",
      "Testea la integración",
    ],
  },
  {
    title: "Envío Masivo",
    description: "Envía mensajes a múltiples contactos",
    icon: Users,
    color: "bg-green-500",
    steps: [
      "Prepara lista de contactos",
      "Diseña plantilla de mensaje",
      "Implementa rate limiting",
      "Monitorea entregas",
      "Maneja respuestas automáticas",
    ],
  },
];

const sdkLibraries = [
  {
    name: "JavaScript/Node.js",
    description: "SDK oficial para JavaScript y Node.js",
    icon: "🟨",
    version: "v2.3.0",
    downloads: "12.5k",
    installCommand: "npm install @baileys-api/sdk",
  },
  {
    name: "Python",
    description: "Cliente Python con soporte asyncio",
    icon: "🐍",
    version: "v1.8.2",
    downloads: "8.2k",
    installCommand: "pip install baileys-api-client",
  },
  {
    name: "PHP",
    description: "SDK para PHP 7.4+ con Composer",
    icon: "🐘",
    version: "v1.5.1",
    downloads: "5.8k",
    installCommand: "composer require baileys-api/php-sdk",
  },
  {
    name: "Go",
    description: "Cliente Go con soporte para concurrencia",
    icon: "🐹",
    version: "v1.2.0",
    downloads: "3.1k",
    installCommand: "go get github.com/baileys-api/go-client",
  },
];

export default function DeveloperPage() {
  const [selectedExample, setSelectedExample] = useState("appsheet");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [showAppSheetGuide, setShowAppSheetGuide] = useState(false);
  const [showApiTesting, setShowApiTesting] = useState(false);
  const [showNoCodePlatforms, setShowNoCodePlatforms] = useState(false);
  const [showResources, setShowResources] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "El código ha sido copiado al portapapeles",
    });
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Centro de Desarrolladores
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-0.5 text-xs sm:text-sm">
            SDKs, ejemplos de código y documentación para integrar WhatsApp
          </p>
        </div>

        <div className="flex flex-row items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/dashboard/developer/api-reference">
              <BookOpen className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">API Docs</span>
              <span className="sm:hidden">Docs</span>
            </Link>
          </Button>

          <Button asChild size="sm" className="text-xs">
            <Link href="/dashboard/developer/playground">
              <Play className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Playground</span>
              <span className="sm:hidden">Play</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Start Guides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {quickStartGuides.map((guide, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${guide.color} flex items-center justify-center flex-shrink-0`}
                >
                  <guide.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm sm:text-base leading-tight">{guide.title}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{guide.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {guide.steps.slice(0, 2).map((step, stepIndex) => (
                  <div
                    key={stepIndex}
                    className="flex items-start gap-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {stepIndex + 1}
                    </div>
                    <span className="text-xs text-muted-foreground leading-tight">{step}</span>
                  </div>
                ))}
                {guide.steps.length > 2 && (
                  <div className="text-xs text-muted-foreground ml-6">+{guide.steps.length - 2} pasos más</div>
                )}
              </div>
              <Button className="w-full mt-2" variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                <span className="text-xs">Ver Guía</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SDK Libraries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <Package className="h-4 w-4 mr-2" />
            SDKs Oficiales
          </CardTitle>
          <CardDescription className="text-xs">
            Librerías para integrar la API de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sdkLibraries.map((sdk, index) => (
              <div
                key={index}
                className="p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">{sdk.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm truncate">{sdk.name}</h3>
                      <Badge variant="secondary" className="text-xs">{sdk.version}</Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded p-1.5 font-mono text-xs mb-2 overflow-x-auto">
                  <code className="whitespace-nowrap">{sdk.installCommand}</code>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => copyToClipboard(sdk.installCommand)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Docs</span>
                    <span className="sm:hidden">Doc</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <Code2 className="h-4 w-4 mr-2" />
            Ejemplos de Código
          </CardTitle>
          <CardDescription className="text-xs">
            Ejemplos prácticos para diferentes lenguajes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="javascript" className="text-xs px-2">JS</TabsTrigger>
              <TabsTrigger value="python" className="text-xs px-2">Python</TabsTrigger>
              <TabsTrigger value="php" className="text-xs px-2">PHP</TabsTrigger>
            </TabsList>

            {Object.keys(codeExamples).map((lang) => (
              <TabsContent key={lang} value={lang} className="space-y-2">
                <div className="flex gap-1 mb-2">
                  <Button
                    variant={
                      selectedExample === "appsheet" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedExample("appsheet")}
                    className="text-xs px-2 h-7"
                  >
                    <Smartphone className="h-3 w-3 mr-1" />
                    App
                  </Button>
                  <Button
                    variant={
                      selectedExample === "message" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedExample("message")}
                    className="text-xs px-2 h-7"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Msg
                  </Button>
                  <Button
                    variant={
                      selectedExample === "webhook" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedExample("webhook")}
                    className="text-xs px-2 h-7"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Hook
                  </Button>
                </div>

                <div className="relative">
                  <Button
                    className="absolute top-2 right-2 z-10"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        codeExamples[lang as keyof typeof codeExamples][
                          selectedExample as keyof typeof codeExamples.javascript
                        ]
                      )
                    }
                  >
                    <Copy className="h-3 w-3" />
                  </Button>

                  <pre className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm max-h-64 sm:max-h-96 overflow-y-auto">
                    <code>
                      {
                        codeExamples[lang as keyof typeof codeExamples][
                          selectedExample as keyof typeof codeExamples.javascript
                        ]
                      }
                    </code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* AppSheet Integration Guide */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-sm sm:text-base">
                <Puzzle className="h-4 w-4 mr-2" />
                Integración con AppSheet
              </CardTitle>
              <CardDescription className="text-xs">
                Guía completa para implementar CRUD con AppSheet y WhatsApp
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAppSheetGuide(!showAppSheetGuide)}
              className="h-6 w-6 p-0"
            >
              {showAppSheetGuide ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showAppSheetGuide && (
        <CardContent>
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                ¿Por qué AppSheet?
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li>• Sin código: Crea aplicaciones sin programar</li>
                <li>• Integración nativa con Google Sheets</li>
                <li>• Webhooks automáticos para notificaciones</li>
                <li>• Interfaz móvil responsive automática</li>
                <li>• Sincronización en tiempo real</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  CONFIGURACIÓN INICIAL
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <strong>1. Crear Google Sheet</strong>
                    <p className="text-muted-foreground mt-1">
                      Columnas: ID, Nombre, Teléfono, Mensaje, Estado, Fecha
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <strong>2. Conectar AppSheet</strong>
                    <p className="text-muted-foreground mt-1">
                      Importar Sheet y configurar tipos de datos
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <strong>3. Configurar Webhook</strong>
                    <p className="text-muted-foreground mt-1">
                      URL: tu-servidor.com/appsheet-webhook
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  OPERACIONES CRUD
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <strong className="text-green-700 dark:text-green-300">CREATE</strong>
                    <p className="text-muted-foreground mt-1">
                      Formulario → Webhook → Enviar WhatsApp
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <strong className="text-blue-700 dark:text-blue-300">READ</strong>
                    <p className="text-muted-foreground mt-1">
                      Vista de tabla con filtros y búsqueda
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <strong className="text-orange-700 dark:text-orange-300">UPDATE</strong>
                    <p className="text-muted-foreground mt-1">
                      Editar registro → Notificar cambios
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
                    <strong className="text-red-700 dark:text-red-300">DELETE</strong>
                    <p className="text-muted-foreground mt-1">
                      Eliminar con confirmación automática
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        )}
      </Card>

      {/* API Endpoints Quick Reference */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center text-xl sm:text-2xl">
            <Globe className="h-5 w-5 mr-2" />
            Endpoints Principales
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Referencia rápida de los endpoints más utilizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                MENSAJES
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-green-600 text-xs sm:text-sm font-mono">POST /chats/send</code>
                  <span className="text-muted-foreground text-xs sm:text-sm">Enviar mensaje</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-green-600 text-xs sm:text-sm font-mono">POST /chats/send-bulk</code>
                  <span className="text-muted-foreground text-xs sm:text-sm">Envío masivo</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-blue-600 text-xs sm:text-sm font-mono">GET /chats</code>
                  <span className="text-muted-foreground text-xs sm:text-sm">Lista de chats</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-orange-600 text-xs sm:text-sm font-mono">POST /chats/reply</code>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    Responder mensaje
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                GRUPOS
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-green-600 text-xs sm:text-sm font-mono">POST /groups/create</code>
                  <span className="text-muted-foreground text-xs sm:text-sm">Crear grupo</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-blue-600 text-xs sm:text-sm font-mono">GET /groups</code>
                  <span className="text-muted-foreground text-xs sm:text-sm">Listar grupos</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-orange-600 text-xs sm:text-sm font-mono break-all">
                    POST /groups/participants-update
                  </code>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    Gestionar miembros
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-blue-600 text-xs sm:text-sm font-mono break-all">
                    GET /groups/invite-code/:jid
                  </code>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    Código invitación
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-2 xl:col-span-1">
              <h3 className="font-medium text-sm text-muted-foreground">
                WEBHOOKS
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-green-600 text-xs sm:text-sm font-mono">POST /webhook/create</code>
                  <span className="text-muted-foreground text-xs sm:text-sm">Crear webhook</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-blue-600 text-xs sm:text-sm font-mono break-all">
                    GET /webhook/notifications/:userId
                  </code>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    Ver notificaciones
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-orange-600 text-xs sm:text-sm font-mono break-all">
                    PUT /webhook/configure/:userId
                  </code>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    Configurar webhook
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded gap-1 sm:gap-2">
                  <code className="text-blue-600 text-xs sm:text-sm font-mono break-all">
                    GET /webhook/stats/:userId
                  </code>
                  <span className="text-muted-foreground text-xs sm:text-sm">Estadísticas</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                Autenticación
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-200 leading-relaxed">
              Todos los endpoints requieren el header{" "}
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded text-xs">
                x-access-token
              </code>
              {" "}con tu token de autenticación, excepto los webhooks que son
              públicos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Terminal className="h-4 w-4 mr-2" />
                  API Testing
                </CardTitle>
                <CardDescription className="text-xs">Herramientas para probar la API</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiTesting(!showApiTesting)}
                className="h-6 w-6 p-0"
              >
                {showApiTesting ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showApiTesting && (
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              <Button asChild variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                <Link href="/dashboard/developer/playground">
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  API Playground
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                <a href="#" target="_blank">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Postman Collection</span>
                  <span className="sm:hidden">Postman</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                <a href="#" target="_blank">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">OpenAPI Spec</span>
                  <span className="sm:hidden">OpenAPI</span>
                </a>
              </Button>
            </div>
          </CardContent>
        )}
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <Puzzle className="h-4 w-4 mr-2" />
                  Plataformas No-Code
                </CardTitle>
                <CardDescription className="text-xs">Integra sin programar</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNoCodePlatforms(!showNoCodePlatforms)}
                className="h-6 w-6 p-0"
              >
                {showNoCodePlatforms ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showNoCodePlatforms && (
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">📱</span>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium truncate">AppSheet</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Google Apps</div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">⚡</span>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium truncate">Zapier</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Automatización</div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">🔷</span>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium truncate">Make.com</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Integrator</div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">🔶</span>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium truncate">Power Automate</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Microsoft</div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">📊</span>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium truncate">Airtable</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Base de datos</div>
                </div>
              </Button>
            </div>
          </CardContent>
        )}
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Recursos
                </CardTitle>
                <CardDescription className="text-xs">Documentación y soporte</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResources(!showResources)}
                className="h-6 w-6 p-0"
              >
                {showResources ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showResources && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3">
              <Button asChild variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                <Link href="/dashboard/developer/docs">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Documentación</span>
                  <span className="sm:hidden">Docs</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                <a href="#" target="_blank">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Discord
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full h-8 sm:h-9 text-xs sm:text-sm col-span-2 sm:col-span-1">
                <a href="#" target="_blank">
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        )}
        </Card>
      </div>
    </div>
  );
}
