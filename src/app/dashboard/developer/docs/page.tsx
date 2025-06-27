'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Search, 
  Copy, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  FileText,
  Code2,
  Lightbulb,
  Zap,
  MessageSquare,
  Smartphone,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  Rocket,
  Globe,
  Key,
  Lock
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface DocSection {
  id: string
  title: string
  description: string
  icon: any
  category: 'guide' | 'api' | 'tutorial' | 'reference'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  content: DocContent[]
  tags: string[]
}

interface DocContent {
  type: 'text' | 'code' | 'warning' | 'tip' | 'example' | 'image'
  content: string
  language?: string
  title?: string
}

const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Primeros Pasos',
    description: 'Guía completa para comenzar a usar la API de WhatsApp con Baileys',
    icon: Rocket,
    category: 'guide',
    difficulty: 'beginner',
    estimatedTime: '10 min',
    tags: ['inicio', 'configuracion', 'basico'],
    content: [
      {
        type: 'text',
        content: 'Bienvenido a la API de WhatsApp con Baileys. Esta guía te ayudará a configurar tu primer bot de WhatsApp en minutos.'
      },
      {
        type: 'warning',
        content: 'Asegúrate de tener un número de teléfono dedicado para el bot. No uses tu número personal.'
      },
      {
        type: 'text',
        content: '## Paso 1: Configuración Inicial\n\nPrimero, necesitas obtener tu token de autenticación desde el panel de control.'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Configuración básica',
        content: `// Configurar la URL base de la API
const API_URL = 'http://100.42.185.2:8015'
const AUTH_TOKEN = 'tu-token-aqui'

// Headers básicos para todas las peticiones
const headers = {
  'Content-Type': 'application/json',
  'x-access-token': AUTH_TOKEN
}`
      },
      {
        type: 'text',
        content: '## Paso 2: Crear tu Primera Sesión\n\nUna sesión representa una instancia de WhatsApp conectada.'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Crear sesión',
        content: `async function createSession(sessionId) {
  const response = await fetch(\`\${API_URL}/sessions/add\`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: sessionId,
      token: AUTH_TOKEN,
      typeAuth: 'qr' // o 'code' para autenticación por SMS
    })
  })
  
  const data = await response.json()
  
  if (data.success && data.data.qr) {
    console.log('Escanea este código QR con WhatsApp:')
    console.log(data.data.qr)
  }
  
  return data
}`
      },
      {
        type: 'tip',
        content: 'Usa nombres descriptivos para tus sesiones como "bot-ventas" o "soporte-cliente".'
      },
      {
        type: 'text',
        content: '## Paso 3: Verificar Estado de la Sesión\n\nAntes de enviar mensajes, verifica que la sesión esté autenticada.'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Verificar estado',
        content: `async function checkSessionStatus(sessionId) {
  const response = await fetch(\`\${API_URL}/sessions/status/\${sessionId}\`, {
    headers
  })
  
  const data = await response.json()
  
  if (data.success) {
    console.log('Estado de la sesión:', data.data.status)
    // Estados posibles: connecting, connected, authenticated, disconnected
    return data.data.status === 'authenticated'
  }
  
  return false
}`
      },
      {
        type: 'text',
        content: '## Paso 4: Enviar tu Primer Mensaje\n\nAhora puedes enviar mensajes a cualquier número de WhatsApp.'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Enviar mensaje',
        content: `async function sendMessage(sessionId, phoneNumber, message) {
  const response = await fetch(\`\${API_URL}/chats/send?id=\${sessionId}\`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      receiver: phoneNumber, // Formato: +573001234567
      isGroup: false,
      message: {
        text: message
      }
    })
  })
  
  const data = await response.json()
  
  if (data.success) {
    console.log('Mensaje enviado exitosamente')
  } else {
    console.error('Error:', data.message)
  }
  
  return data
}`
      },
      {
        type: 'example',
        title: 'Ejemplo completo',
        content: `// Ejemplo completo de uso
async function main() {
  const sessionId = 'mi-primer-bot'
  
  // 1. Crear sesión
  await createSession(sessionId)
  
  // 2. Esperar un momento para autenticación
  console.log('Escanea el código QR y espera...')
  await new Promise(resolve => setTimeout(resolve, 30000))
  
  // 3. Verificar estado
  const isAuthenticated = await checkSessionStatus(sessionId)
  
  if (isAuthenticated) {
    // 4. Enviar mensaje
    await sendMessage(sessionId, '+573001234567', '¡Hola! Este es mi primer mensaje desde el bot.')
  }
}

main().catch(console.error)`
      }
    ]
  },
  {
    id: 'advanced-messaging',
    title: 'Mensajería Avanzada',
    description: 'Aprende a enviar diferentes tipos de mensajes: imágenes, videos, documentos y más',
    icon: MessageSquare,
    category: 'tutorial',
    difficulty: 'intermediate',
    estimatedTime: '20 min',
    tags: ['mensajes', 'multimedia', 'avanzado'],
    content: [
      {
        type: 'text',
        content: 'La API soporta múltiples tipos de mensajes más allá del texto simple. Aquí aprenderás a usar todas las opciones disponibles.'
      },
      {
        type: 'text',
        content: '## Mensajes de Texto con Formato\n\nPuedes usar formato Markdown en tus mensajes de texto:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Texto con formato',
        content: `const messageWithFormat = {
  receiver: '+573001234567',
  isGroup: false,
  message: {
    text: \`*Texto en negrita*
_Texto en cursiva_
~Texto tachado~
\\\`Texto monoespaciado\\\`

Lista:
• Elemento 1
• Elemento 2
• Elemento 3\`
  }
}`
      },
      {
        type: 'text',
        content: '## Enviar Imágenes\n\nPuedes enviar imágenes desde URLs públicas:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Enviar imagen',
        content: `async function sendImage(sessionId, phoneNumber, imageUrl, caption) {
  const response = await fetch(\`\${API_URL}/chats/send?id=\${sessionId}\`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      receiver: phoneNumber,
      isGroup: false,
      message: {
        image: { url: imageUrl },
        caption: caption || ''
      }
    })
  })
  
  return await response.json()
}

// Ejemplo de uso
await sendImage(
  'mi-bot',
  '+573001234567',
  'https://example.com/imagen.jpg',
  'Esta es una imagen de ejemplo 📸'
)`
      },
      {
        type: 'text',
        content: '## Enviar Videos\n\nSimilar a las imágenes, puedes enviar videos:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Enviar video',
        content: `async function sendVideo(sessionId, phoneNumber, videoUrl, caption) {
  const response = await fetch(\`\${API_URL}/chats/send?id=\${sessionId}\`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      receiver: phoneNumber,
      isGroup: false,
      message: {
        video: { url: videoUrl },
        caption: caption || ''
      }
    })
  })
  
  return await response.json()
}`
      },
      {
        type: 'text',
        content: '## Enviar Documentos\n\nPuedes compartir documentos PDF, Word, Excel, etc:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Enviar documento',
        content: `async function sendDocument(sessionId, phoneNumber, documentUrl, fileName, mimeType) {
  const response = await fetch(\`\${API_URL}/chats/send?id=\${sessionId}\`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      receiver: phoneNumber,
      isGroup: false,
      message: {
        document: { url: documentUrl },
        fileName: fileName,
        mimetype: mimeType,
        caption: 'Aquí tienes el documento solicitado'
      }
    })
  })
  
  return await response.json()
}

// Ejemplos de uso
await sendDocument(
  'mi-bot',
  '+573001234567',
  'https://example.com/documento.pdf',
  'Manual de Usuario.pdf',
  'application/pdf'
)`
      },
      {
        type: 'text',
        content: '## Enviar Ubicación\n\nComparte ubicaciones usando coordenadas:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Enviar ubicación',
        content: `async function sendLocation(sessionId, phoneNumber, latitude, longitude, name) {
  const response = await fetch(\`\${API_URL}/chats/send?id=\${sessionId}\`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      receiver: phoneNumber,
      isGroup: false,
      message: {
        location: {
          degreesLatitude: latitude,
          degreesLongitude: longitude,
          name: name || 'Ubicación compartida'
        }
      }
    })
  })
  
  return await response.json()
}

// Ejemplo: Enviar ubicación de la Torre Eiffel
await sendLocation(
  'mi-bot',
  '+573001234567',
  48.8584,
  2.2945,
  'Torre Eiffel, París'
)`
      },
      {
        type: 'tip',
        content: 'Asegúrate de que todas las URLs sean públicamente accesibles. Las URLs privadas o con autenticación no funcionarán.'
      }
    ]
  },
  {
    id: 'webhooks-guide',
    title: 'Configuración de Webhooks',
    description: 'Aprende a recibir eventos de WhatsApp en tiempo real',
    icon: Zap,
    category: 'tutorial',
    difficulty: 'intermediate',
    estimatedTime: '15 min',
    tags: ['webhooks', 'eventos', 'tiempo-real'],
    content: [
      {
        type: 'text',
        content: 'Los webhooks te permiten recibir notificaciones en tiempo real cuando ocurren eventos en tus sesiones de WhatsApp.'
      },
      {
        type: 'warning',
        content: 'Tu servidor debe ser accesible públicamente y usar HTTPS para recibir webhooks de manera segura.'
      },
      {
        type: 'text',
        content: '## Configurar un Webhook\n\nPrimero, crea un webhook asociado a tu sesión:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Crear webhook',
        content: `async function createWebhook(userId, sessionId, webhookUrl) {
  const response = await fetch(\`\${API_URL}/webhook/create\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // Nota: Los webhooks no requieren autenticación
    },
    body: JSON.stringify({
      userId: userId,
      sessionId: sessionId,
      events: [
        'message.new',     // Nuevos mensajes recibidos
        'message.ack',     // Confirmaciones de entrega
        'session.status',  // Cambios de estado de sesión
        'session.qr'       // Nuevos códigos QR
      ],
      webhookUrl: webhookUrl // Tu endpoint público
    })
  })
  
  const data = await response.json()
  
  if (data.success) {
    console.log('Webhook creado:', data.data.webhookId)
    return data.data
  }
  
  throw new Error(data.message)
}`
      },
      {
        type: 'text',
        content: '## Crear el Endpoint Receptor\n\nImplementa un endpoint en tu servidor para recibir los eventos:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Express.js Webhook Endpoint',
        content: `const express = require('express')
const app = express()

app.use(express.json())

app.post('/webhook', (req, res) => {
  const { type, data } = req.body
  
  console.log('Evento recibido:', type, data)
  
  switch (type) {
    case 'message.new':
      handleNewMessage(data)
      break
      
    case 'message.ack':
      handleMessageAck(data)
      break
      
    case 'session.status':
      handleSessionStatus(data)
      break
      
    case 'session.qr':
      handleNewQR(data)
      break
      
    default:
      console.log('Evento no manejado:', type)
  }
  
  // Importante: Responder con 200 para confirmar recepción
  res.status(200).send('OK')
})

function handleNewMessage(data) {
  const { message, from, sessionId } = data
  
  console.log(\`Nuevo mensaje de \${from}: \${message.text}\`)
  
  // Aquí puedes implementar tu lógica de respuesta automática
  if (message.text && message.text.toLowerCase().includes('hola')) {
    sendMessage(sessionId, from, '¡Hola! ¿En qué puedo ayudarte?')
  }
}

function handleMessageAck(data) {
  const { messageId, status } = data
  
  console.log(\`Mensaje \${messageId} - Estado: \${status}\`)
  // Estados: sent, delivered, read
}

function handleSessionStatus(data) {
  const { sessionId, status } = data
  
  console.log(\`Sesión \${sessionId} - Estado: \${status}\`)
  
  if (status === 'disconnected') {
    console.log('¡Alerta! Sesión desconectada')
    // Implementar lógica de reconexión
  }
}

function handleNewQR(data) {
  const { sessionId, qr } = data
  
  console.log(\`Nuevo QR para sesión \${sessionId}\`)
  // Mostrar QR en tu interfaz
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000')
})`
      },
      {
        type: 'text',
        content: '## Configurar HTTPS con ngrok (Para desarrollo)\n\nPara pruebas locales, puedes usar ngrok:'
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Configurar ngrok',
        content: `# Instalar ngrok
npm install -g ngrok

# Exponer puerto local 3000 con HTTPS
ngrok http 3000

# Usar la URL HTTPS generada como webhookUrl
# Ejemplo: https://abc123.ngrok.io/webhook`
      },
      {
        type: 'tip',
        content: 'En producción, usa un certificado SSL válido. Servicios como Let\'s Encrypt ofrecen certificados gratuitos.'
      },
      {
        type: 'text',
        content: '## Verificar y Gestionar Webhooks\n\nPuedes verificar el estado de tus webhooks:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Gestionar webhooks',
        content: `// Obtener estadísticas del webhook
async function getWebhookStats(userId) {
  const response = await fetch(\`\${API_URL}/webhook/stats/\${userId}\`)
  const data = await response.json()
  
  if (data.success) {
    console.log('Estadísticas:', data.data)
    return data.data
  }
}

// Obtener notificaciones pendientes
async function getNotifications(userId, limit = 10) {
  const response = await fetch(\`\${API_URL}/webhook/notifications/\${userId}?limit=\${limit}\`)
  const data = await response.json()
  
  if (data.success) {
    return data.data
  }
}

// Marcar notificación como leída
async function markAsRead(userId, notificationId) {
  const response = await fetch(\`\${API_URL}/webhook/notifications/\${userId}/\${notificationId}/read\`, {
    method: 'PUT'
  })
  
  return await response.json()
}`
      }
    ]
  },
  {
    id: 'api-reference',
    title: 'Referencia Completa de API',
    description: 'Documentación técnica detallada de todos los endpoints disponibles',
    icon: Globe,
    category: 'reference',
    difficulty: 'advanced',
    estimatedTime: '30 min',
    tags: ['api', 'referencia', 'endpoints'],
    content: [
      {
        type: 'text',
        content: 'Esta es la referencia completa de todos los endpoints disponibles en la API de Baileys.'
      },
      {
        type: 'text',
        content: '## Autenticación\n\nTodos los endpoints (excepto webhooks) requieren autenticación mediante el header `x-access-token`:'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Headers de autenticación',
        content: `const headers = {
  'Content-Type': 'application/json',
  'x-access-token': 'tu-token-de-acceso'
}`
      },
      {
        type: 'text',
        content: '## Endpoints de Sesiones\n\n### POST /sessions/add\nCrea una nueva sesión de WhatsApp.'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Crear sesión',
        content: `// Request
{
  "id": "nombre-de-la-sesion",
  "token": "tu-token",
  "typeAuth": "qr" // o "code"
}

// Response
{
  "success": true,
  "message": "QR code received, please scan the QR code.",
  "data": {
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}`
      },
      {
        type: 'text',
        content: '### GET /sessions/list\nObtiene la lista de todas las sesiones.'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Listar sesiones',
        content: `// Response
{
  "success": true,
  "message": "Session list",
  "data": [
    "sesion-1",
    "sesion-2",
    "sesion-3"
  ]
}`
      },
      {
        type: 'text',
        content: '### GET /sessions/status/:id\nObtiene el estado de una sesión específica.'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Estado de sesión',
        content: `// Response
{
  "success": true,
  "message": "",
  "data": {
    "status": "authenticated" // connecting, connected, authenticated, disconnected
  }
}`
      },
      {
        type: 'text',
        content: '## Endpoints de Mensajería\n\n### POST /chats/send?id=sessionId\nEnvía un mensaje.'
      },
      {
        type: 'code',
        language: 'javascript',
        title: 'Enviar mensaje',
        content: `// Request - Texto
{
  "receiver": "+573001234567",
  "isGroup": false,
  "message": {
    "text": "Hola mundo"
  }
}

// Request - Imagen
{
  "receiver": "+573001234567",
  "isGroup": false,
  "message": {
    "image": {
      "url": "https://example.com/image.jpg"
    },
    "caption": "Descripción de la imagen"
  }
}

// Response
{
  "success": true,
  "message": "The message has been successfully sent.",
  "data": {}
}`
      },
      {
        type: 'text',
        content: '### GET /chats?id=sessionId\nObtiene la lista de chats.'
      },
      {
        type: 'text',
        content: '### GET /chats/:jid?id=sessionId\nObtiene los mensajes de un chat específico.'
      },
      {
        type: 'text',
        content: '## Códigos de Estado HTTP\n\nLa API utiliza códigos de estado HTTP estándar:'
      },
      {
        type: 'code',
        language: 'text',
        title: 'Códigos de estado',
        content: `200 OK - Solicitud exitosa
400 Bad Request - Error en los parámetros
401 Unauthorized - Token inválido o faltante
404 Not Found - Recurso no encontrado
409 Conflict - Recurso ya existe
500 Internal Server Error - Error del servidor`
      },
      {
        type: 'text',
        content: '## Límites de Rate Limiting\n\nLa API implementa límites para prevenir abuso:'
      },
      {
        type: 'code',
        language: 'text',
        title: 'Límites de la API',
        content: `• 100 solicitudes por minuto por token
• 1000 mensajes por hora por sesión
• Tamaño máximo de archivo: 16MB
• Timeout de request: 30 segundos`
      }
    ]
  }
]

export default function DocsPage() {
  const [selectedSection, setSelectedSection] = useState<DocSection>(docSections[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSections, setFilteredSections] = useState<DocSection[]>(docSections)
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (searchQuery) {
      const filtered = docSections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        section.content.some(content => 
          content.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      setFilteredSections(filtered)
    } else {
      setFilteredSections(docSections)
    }
  }, [searchQuery])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Código copiado!",
      description: "El código ha sido copiado al portapapeles",
    })
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'guide':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'tutorial':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'api':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'reference':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600'
      case 'intermediate':
        return 'text-yellow-600'
      case 'advanced':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const renderContent = (content: DocContent, index: number) => {
    switch (content.type) {
      case 'text':
        return (
          <div key={index} className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: content.content
                .replace(/\n/g, '<br>')
                .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">$1</code>')
            }} />
          </div>
        )
      
      case 'code':
        return (
          <Card key={index} className="mt-4">
            {content.title && (
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{content.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(content.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className={content.title ? 'pt-0' : ''}>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{content.content}</code>
              </pre>
            </CardContent>
          </Card>
        )
      
      case 'warning':
        return (
          <div key={index} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mt-4">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-red-800 dark:text-red-200 text-sm">{content.content}</p>
          </div>
        )
      
      case 'tip':
        return (
          <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mt-4">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-blue-800 dark:text-blue-200 text-sm">{content.content}</p>
          </div>
        )
      
      case 'example':
        return (
          <Card key={index} className="mt-4 border-green-200 dark:border-green-800">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="text-sm text-green-800 dark:text-green-200 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                {content.title || 'Ejemplo'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{content.content}</code>
              </pre>
            </CardContent>
          </Card>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Documentación
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Guías completas, tutoriales y referencia de la API de WhatsApp
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a href="#" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              GitHub
            </a>
          </Button>
          
          <Button variant="outline" asChild>
            <a href="#" target="_blank">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en la documentación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contenido</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredSections.map((section) => (
                  <Button
                    key={section.id}
                    variant={selectedSection.id === section.id ? 'default' : 'ghost'}
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => setSelectedSection(section)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <section.icon className="h-5 w-5 mt-0.5" />
                      <div className="text-left flex-1">
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {section.estimatedTime}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(section.category)}`}
                          >
                            {section.category}
                          </Badge>
                          <span className={`text-xs ${getDifficultyColor(section.difficulty)}`}>
                            {section.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <selectedSection.icon className="h-8 w-8 text-primary mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-2xl">{selectedSection.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {selectedSection.description}
                  </CardDescription>
                  
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {selectedSection.estimatedTime}
                      </span>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={getCategoryColor(selectedSection.category)}
                    >
                      {selectedSection.category}
                    </Badge>
                    
                    <Badge 
                      variant="outline"
                      className={getDifficultyColor(selectedSection.difficulty)}
                    >
                      {selectedSection.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedSection.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {selectedSection.content.map((content, index) => 
                  renderContent(content, index)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}