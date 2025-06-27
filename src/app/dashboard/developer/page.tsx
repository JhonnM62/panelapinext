'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Rocket
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
// import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

const API_BASE_URL = 'http://100.42.185.2:8015'

// Ejemplos de código para diferentes lenguajes
const codeExamples = {
  javascript: {
    session: `// Crear nueva sesión WhatsApp
import axios from 'axios'

const API_URL = '${API_BASE_URL}'

const createSession = async (sessionId, token) => {
  try {
    const response = await axios.post(\`\${API_URL}/sessions/add\`, {
      id: sessionId,
      token: token,
      typeAuth: 'qr' // o 'code' para código de verificación
    }, {
      headers: {
        'x-access-token': token
      }
    })
    
    console.log('Sesión creada:', response.data)
    return response.data
  } catch (error) {
    console.error('Error:', error.response?.data || error.message)
  }
}

// Usar la función
createSession('mi-bot-session', 'tu-token-aqui')`,
    
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
})`
  },
  
  python: {
    session: `# Crear sesión WhatsApp con Python
import requests
import json

API_URL = '${API_BASE_URL}'

def create_session(session_id, token):
    url = f'{API_URL}/sessions/add'
    headers = {
        'Content-Type': 'application/json',
        'x-access-token': token
    }
    data = {
        'id': session_id,
        'token': token,
        'typeAuth': 'qr'
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        return None

# Usar la función
result = create_session('mi-bot-session', 'tu-token-aqui')
print(json.dumps(result, indent=2))`,

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
    app.run(host='0.0.0.0', port=3000)`
  },

  php: {
    session: `<?php
// Crear sesión WhatsApp con PHP
function createSession($sessionId, $token) {
    $url = '${API_BASE_URL}/sessions/add';
    $headers = [
        'Content-Type: application/json',
        'x-access-token: ' . $token
    ];
    $data = json_encode([
        'id' => $sessionId,
        'token' => $token,
        'typeAuth' => 'qr'
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

// Usar la función
$result = createSession('mi-bot-session', 'tu-token-aqui');
print_r($result);
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
?>`
  }
}

const quickStartGuides = [
  {
    title: 'Guía Rápida - 5 minutos',
    description: 'Conecta tu primera sesión WhatsApp',
    icon: Rocket,
    color: 'bg-blue-500',
    steps: [
      'Obtén tu token de autenticación',
      'Crea una nueva sesión',
      'Escanea el código QR',
      'Envía tu primer mensaje',
      'Configura webhooks (opcional)'
    ]
  },
  {
    title: 'Configurar Webhooks',
    description: 'Recibe mensajes en tiempo real',
    icon: Zap,
    color: 'bg-yellow-500',
    steps: [
      'Configura un endpoint público',
      'Registra el webhook en la API',
      'Procesa eventos entrantes',
      'Implementa manejo de errores',
      'Testea la integración'
    ]
  },
  {
    title: 'Envío Masivo',
    description: 'Envía mensajes a múltiples contactos',
    icon: Users,
    color: 'bg-green-500',
    steps: [
      'Prepara lista de contactos',
      'Diseña plantilla de mensaje',
      'Implementa rate limiting',
      'Monitorea entregas',
      'Maneja respuestas automáticas'
    ]
  }
]

const sdkLibraries = [
  {
    name: 'JavaScript/Node.js',
    description: 'SDK oficial para JavaScript y Node.js',
    icon: '🟨',
    version: 'v2.3.0',
    downloads: '12.5k',
    installCommand: 'npm install @baileys-api/sdk'
  },
  {
    name: 'Python',
    description: 'Cliente Python con soporte asyncio',
    icon: '🐍',
    version: 'v1.8.2',
    downloads: '8.2k',
    installCommand: 'pip install baileys-api-client'
  },
  {
    name: 'PHP',
    description: 'SDK para PHP 7.4+ con Composer',
    icon: '🐘',
    version: 'v1.5.1',
    downloads: '5.8k',
    installCommand: 'composer require baileys-api/php-sdk'
  },
  {
    name: 'Go',
    description: 'Cliente Go con soporte para concurrencia',
    icon: '🐹',
    version: 'v1.2.0',
    downloads: '3.1k',
    installCommand: 'go get github.com/baileys-api/go-client'
  }
]

export default function DeveloperPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [selectedExample, setSelectedExample] = useState('session')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "El código ha sido copiado al portapapeles",
    })
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Centro de Desarrolladores
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            SDKs, ejemplos de código y documentación para integrar WhatsApp en tu aplicación
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/developer/api-reference">
              <BookOpen className="h-4 w-4 mr-2" />
              API Reference
            </Link>
          </Button>
          
          <Button asChild>
            <Link href="/dashboard/developer/playground">
              <Play className="h-4 w-4 mr-2" />
              API Playground
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Start Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStartGuides.map((guide, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`w-10 h-10 rounded-lg ${guide.color} flex items-center justify-center mb-3`}>
                <guide.icon className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-lg">{guide.title}</CardTitle>
              <CardDescription>{guide.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guide.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                      {stepIndex + 1}
                    </div>
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Guía Completa
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SDK Libraries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            SDKs Oficiales
          </CardTitle>
          <CardDescription>
            Librerías oficiales para integrar la API de WhatsApp en tu lenguaje favorito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sdkLibraries.map((sdk, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sdk.icon}</span>
                    <div>
                      <h3 className="font-medium">{sdk.name}</h3>
                      <p className="text-sm text-muted-foreground">{sdk.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{sdk.version}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{sdk.downloads} descargas</p>
                  </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono text-sm mb-3">
                  {sdk.installCommand}
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(sdk.installCommand)}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Docs
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    GitHub
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code2 className="h-5 w-5 mr-2" />
            Ejemplos de Código
          </CardTitle>
          <CardDescription>
            Ejemplos prácticos listos para usar en diferentes lenguajes de programación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>

            {Object.keys(codeExamples).map((lang) => (
              <TabsContent key={lang} value={lang} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button 
                    variant={selectedExample === 'session' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedExample('session')}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Sesiones
                  </Button>
                  <Button 
                    variant={selectedExample === 'message' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedExample('message')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mensajes
                  </Button>
                  <Button 
                    variant={selectedExample === 'webhook' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedExample('webhook')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Webhooks
                  </Button>
                </div>

                <div className="relative">
                  <Button
                    className="absolute top-3 right-3 z-10"
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(codeExamples[lang as keyof typeof codeExamples][selectedExample as keyof typeof codeExamples.javascript])}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>
                      {codeExamples[lang as keyof typeof codeExamples][selectedExample as keyof typeof codeExamples.javascript]}
                    </code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* API Endpoints Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Endpoints Principales
          </CardTitle>
          <CardDescription>
            Referencia rápida de los endpoints más utilizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">SESIONES</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-green-600">POST /sessions/add</code>
                  <span className="text-muted-foreground">Crear sesión</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-blue-600">GET /sessions/list</code>
                  <span className="text-muted-foreground">Listar sesiones</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-blue-600">GET /sessions/status/:id</code>
                  <span className="text-muted-foreground">Estado sesión</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-red-600">DELETE /sessions/delete/:id</code>
                  <span className="text-muted-foreground">Eliminar sesión</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">MENSAJES</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-green-600">POST /chats/send</code>
                  <span className="text-muted-foreground">Enviar mensaje</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-green-600">POST /chats/send-bulk</code>
                  <span className="text-muted-foreground">Envío masivo</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-blue-600">GET /chats</code>
                  <span className="text-muted-foreground">Lista de chats</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-orange-600">POST /chats/reply</code>
                  <span className="text-muted-foreground">Responder mensaje</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">GRUPOS</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-green-600">POST /groups/create</code>
                  <span className="text-muted-foreground">Crear grupo</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-blue-600">GET /groups</code>
                  <span className="text-muted-foreground">Listar grupos</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-orange-600">POST /groups/participants-update</code>
                  <span className="text-muted-foreground">Gestionar miembros</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-blue-600">GET /groups/invite-code/:jid</code>
                  <span className="text-muted-foreground">Código invitación</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">WEBHOOKS</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-green-600">POST /webhook/create</code>
                  <span className="text-muted-foreground">Crear webhook</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-blue-600">GET /webhook/notifications/:userId</code>
                  <span className="text-muted-foreground">Ver notificaciones</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-orange-600">PUT /webhook/configure/:userId</code>
                  <span className="text-muted-foreground">Configurar webhook</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <code className="text-blue-600">GET /webhook/stats/:userId</code>
                  <span className="text-muted-foreground">Estadísticas</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Autenticación</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Todos los endpoints requieren el header <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">x-access-token</code> 
              con tu token de autenticación, excepto los webhooks que son públicos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Terminal className="h-5 w-5 mr-2" />
              API Testing
            </CardTitle>
            <CardDescription>
              Herramientas para probar la API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/developer/playground">
                  <Play className="h-4 w-4 mr-2" />
                  API Playground
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="#" target="_blank">
                  <Download className="h-4 w-4 mr-2" />
                  Postman Collection
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="#" target="_blank">
                  <FileText className="h-4 w-4 mr-2" />
                  OpenAPI Spec
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Puzzle className="h-5 w-5 mr-2" />
              Integraciones
            </CardTitle>
            <CardDescription>
              Conecta con plataformas populares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                <span className="mr-2">⚡</span>
                Zapier
              </Button>
              <Button variant="outline" className="w-full">
                <span className="mr-2">🔷</span>
                Make.com
              </Button>
              <Button variant="outline" className="w-full">
                <span className="mr-2">🌊</span>
                N8N
              </Button>
              <Button variant="outline" className="w-full">
                <span className="mr-2">🔗</span>
                Ver Todas
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BookOpen className="h-5 w-5 mr-2" />
              Recursos
            </CardTitle>
            <CardDescription>
              Documentación y soporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/developer/docs">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentación
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="#" target="_blank">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discord
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="#" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}