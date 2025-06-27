'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Play,
  Copy,
  Save,
  History,
  Star,
  Code2,
  Send,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  BookOpen,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Plus,
  Edit3,
  Globe,
  Key,
  Lock
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface APIEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  title: string
  description: string
  category: string
  requiresAuth: boolean
  parameters: {
    name: string
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    required: boolean
    description: string
    example?: any
    enum?: string[]
  }[]
  bodySchema?: {
    [key: string]: {
      type: string
      required: boolean
      description: string
      example?: any
    }
  }
  responses: {
    [statusCode: string]: {
      description: string
      example: any
    }
  }
}

interface RequestHistory {
  id: string
  timestamp: string
  method: string
  url: string
  status?: number
  duration?: number
  success: boolean
  endpoint: string
}

interface SavedRequest {
  id: string
  name: string
  endpoint: APIEndpoint
  parameters: { [key: string]: any }
  body: string
  headers: { [key: string]: string }
  createdAt: string
}

const API_BASE_URL = 'http://100.42.185.2:8015'

const endpoints: APIEndpoint[] = [
  {
    id: 'sessions-list',
    method: 'GET',
    path: '/sessions/list',
    title: 'Listar Sesiones',
    description: 'Obtiene la lista de todas las sesiones activas',
    category: 'Sesiones',
    requiresAuth: true,
    parameters: [],
    responses: {
      '200': {
        description: 'Lista de sesiones obtenida exitosamente',
        example: {
          success: true,
          message: 'Session list',
          data: ['session-1', 'session-2']
        }
      }
    }
  },
  {
    id: 'sessions-create',
    method: 'POST',
    path: '/sessions/add',
    title: 'Crear Sesión',
    description: 'Crea una nueva sesión de WhatsApp',
    category: 'Sesiones',
    requiresAuth: true,
    parameters: [],
    bodySchema: {
      id: {
        type: 'string',
        required: true,
        description: 'ID único para la sesión',
        example: 'mi-sesion-bot'
      },
      token: {
        type: 'string',
        required: true,
        description: 'Token de autenticación',
        example: 'your-auth-token'
      },
      typeAuth: {
        type: 'string',
        required: false,
        description: 'Tipo de autenticación: qr o code',
        example: 'qr'
      },
      phoneNumber: {
        type: 'string',
        required: false,
        description: 'Número de teléfono para autenticación por código',
        example: '+573001234567'
      }
    },
    responses: {
      '200': {
        description: 'Sesión creada exitosamente',
        example: {
          success: true,
          message: 'QR code received, please scan the QR code.',
          data: {
            qr: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
          }
        }
      },
      '409': {
        description: 'La sesión ya existe',
        example: {
          success: false,
          message: 'Session already exists, please use another id.',
          data: {}
        }
      }
    }
  },
  {
    id: 'sessions-status',
    method: 'GET',
    path: '/sessions/status/:id',
    title: 'Estado de Sesión',
    description: 'Obtiene el estado actual de una sesión',
    category: 'Sesiones',
    requiresAuth: true,
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'ID de la sesión',
        example: 'mi-sesion-bot'
      }
    ],
    responses: {
      '200': {
        description: 'Estado obtenido exitosamente',
        example: {
          success: true,
          message: '',
          data: {
            status: 'authenticated'
          }
        }
      }
    }
  },
  {
    id: 'chats-send',
    method: 'POST',
    path: '/chats/send',
    title: 'Enviar Mensaje',
    description: 'Envía un mensaje de texto, imagen, video, etc.',
    category: 'Mensajes',
    requiresAuth: true,
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'ID de la sesión',
        example: 'mi-sesion-bot'
      }
    ],
    bodySchema: {
      receiver: {
        type: 'string',
        required: true,
        description: 'Número de teléfono del destinatario',
        example: '+573001234567'
      },
      isGroup: {
        type: 'boolean',
        required: false,
        description: 'Si es un mensaje a grupo',
        example: false
      },
      message: {
        type: 'object',
        required: true,
        description: 'Contenido del mensaje',
        example: {
          text: 'Hola, ¿cómo estás?'
        }
      }
    },
    responses: {
      '200': {
        description: 'Mensaje enviado exitosamente',
        example: {
          success: true,
          message: 'The message has been successfully sent.',
          data: {}
        }
      }
    }
  },
  {
    id: 'groups-create',
    method: 'POST',
    path: '/groups/create',
    title: 'Crear Grupo',
    description: 'Crea un nuevo grupo de WhatsApp',
    category: 'Grupos',
    requiresAuth: true,
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'ID de la sesión',
        example: 'mi-sesion-bot'
      }
    ],
    bodySchema: {
      groupName: {
        type: 'string',
        required: true,
        description: 'Nombre del grupo',
        example: 'Mi Grupo de Prueba'
      },
      participants: {
        type: 'array',
        required: true,
        description: 'Lista de participantes (números de teléfono)',
        example: ['+573001234567', '+573007654321']
      }
    },
    responses: {
      '200': {
        description: 'Grupo creado exitosamente',
        example: {
          success: true,
          message: 'Group created successfully',
          data: {
            groupId: '120363027219123456@g.us'
          }
        }
      }
    }
  },
  {
    id: 'webhook-create',
    method: 'POST',
    path: '/webhook/create',
    title: 'Crear Webhook',
    description: 'Configura un webhook para recibir eventos',
    category: 'Webhooks',
    requiresAuth: false,
    parameters: [],
    bodySchema: {
      userId: {
        type: 'string',
        required: true,
        description: 'ID del usuario',
        example: 'user-123'
      },
      sessionId: {
        type: 'string',
        required: true,
        description: 'ID de la sesión',
        example: 'mi-sesion-bot'
      },
      events: {
        type: 'array',
        required: true,
        description: 'Lista de eventos a escuchar',
        example: ['message.new', 'session.status']
      },
      webhookUrl: {
        type: 'string',
        required: false,
        description: 'URL del webhook (opcional)',
        example: 'https://miapp.com/webhook'
      }
    },
    responses: {
      '200': {
        description: 'Webhook creado exitosamente',
        example: {
          success: true,
          message: 'Webhook created successfully',
          data: {
            webhookId: 'webhook-123',
            webhookUrl: 'https://miapp.com/webhook'
          }
        }
      }
    }
  }
]

export default function APIPlaygroundPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint>(endpoints[0])
  const [parameters, setParameters] = useState<{ [key: string]: any }>({})
  const [requestBody, setRequestBody] = useState('')
  const [customHeaders, setCustomHeaders] = useState<{ [key: string]: string }>({
    'Content-Type': 'application/json'
  })
  const [authToken, setAuthToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [responseTime, setResponseTime] = useState<number>(0)
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([])
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([])
  const [activeTab, setActiveTab] = useState('request')

  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('api_playground_token')
    const savedHistory = localStorage.getItem('api_playground_history')
    const savedReqs = localStorage.getItem('api_playground_saved')
    
    if (savedToken) setAuthToken(savedToken)
    if (savedHistory) setRequestHistory(JSON.parse(savedHistory))
    if (savedReqs) setSavedRequests(JSON.parse(savedReqs))
  }, [])

  // Guardar token cuando cambie
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('api_playground_token', authToken)
    }
  }, [authToken])

  // Construir URL completa
  const buildUrl = () => {
    let url = `${API_BASE_URL}${selectedEndpoint.path}`
    
    // Reemplazar parámetros de ruta
    selectedEndpoint.parameters.forEach(param => {
      if (parameters[param.name]) {
        url = url.replace(`:${param.name}`, parameters[param.name])
      }
    })
    
    // Agregar query parameters para GET
    if (selectedEndpoint.method === 'GET' && Object.keys(parameters).length > 0) {
      const queryParams = new URLSearchParams()
      Object.entries(parameters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }
    }
    
    return url
  }

  // Ejecutar request
  const executeRequest = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      const url = buildUrl()
      const headers: { [key: string]: string } = { ...customHeaders }
      
      // Agregar token de autenticación si es requerido
      if (selectedEndpoint.requiresAuth && authToken) {
        headers['x-access-token'] = authToken
      }
      
      const requestOptions: RequestInit = {
        method: selectedEndpoint.method,
        headers
      }
      
      // Agregar body para métodos que lo permiten
      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
        requestOptions.body = requestBody
      }
      
      const response = await fetch(url, requestOptions)
      const responseData = await response.json()
      const endTime = Date.now()
      const duration = endTime - startTime
      
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      })
      setResponseTime(duration)
      
      // Agregar al historial
      const historyEntry: RequestHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        method: selectedEndpoint.method,
        url,
        status: response.status,
        duration,
        success: response.ok,
        endpoint: selectedEndpoint.title
      }
      
      const newHistory = [historyEntry, ...requestHistory.slice(0, 49)]
      setRequestHistory(newHistory)
      localStorage.setItem('api_playground_history', JSON.stringify(newHistory))
      
      toast({
        title: response.ok ? "Request exitoso" : "Request falló",
        description: `${selectedEndpoint.method} ${url} - ${response.status} (${duration}ms)`,
        variant: response.ok ? "default" : "destructive"
      })
      
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      setResponse({
        status: 0,
        statusText: 'Network Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      setResponseTime(duration)
      
      toast({
        title: "Error de red",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar request
  const saveRequest = () => {
    const savedRequest: SavedRequest = {
      id: Date.now().toString(),
      name: `${selectedEndpoint.method} ${selectedEndpoint.title}`,
      endpoint: selectedEndpoint,
      parameters,
      body: requestBody,
      headers: customHeaders,
      createdAt: new Date().toISOString()
    }
    
    const newSaved = [savedRequest, ...savedRequests]
    setSavedRequests(newSaved)
    localStorage.setItem('api_playground_saved', JSON.stringify(newSaved))
    
    toast({
      title: "Request guardado",
      description: "El request ha sido guardado en favoritos"
    })
  }

  // Cargar request guardado
  const loadSavedRequest = (saved: SavedRequest) => {
    setSelectedEndpoint(saved.endpoint)
    setParameters(saved.parameters)
    setRequestBody(saved.body)
    setCustomHeaders(saved.headers)
    
    toast({
      title: "Request cargado",
      description: `Se ha cargado "${saved.name}"`
    })
  }

  // Generar código de ejemplo
  const generateCodeExample = (language: 'javascript' | 'python' | 'curl') => {
    const url = buildUrl()
    const headers = { ...customHeaders }
    if (selectedEndpoint.requiresAuth && authToken) {
      headers['x-access-token'] = authToken
    }
    
    switch (language) {
      case 'javascript':
        return `// JavaScript/Node.js
const response = await fetch('${url}', {
  method: '${selectedEndpoint.method}',
  headers: ${JSON.stringify(headers, null, 2)},${
    ['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody
      ? `\n  body: ${JSON.stringify(requestBody)}`
      : ''
  }
})

const data = await response.json()
console.log(data)`

      case 'python':
        return `# Python
import requests

response = requests.${selectedEndpoint.method.toLowerCase()}(
    '${url}',
    headers=${JSON.stringify(headers, null, 2).replace(/"/g, "'")},${
    ['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody
      ? `\n    json=${requestBody}`
      : ''
  }
)

data = response.json()
print(data)`

      case 'curl':
        return `# cURL
curl -X ${selectedEndpoint.method} \\
  '${url}' \\${Object.entries(headers).map(([key, value]) => `\n  -H '${key}: ${value}' \\`).join('')}${
    ['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody
      ? `\n  -d '${requestBody}'`
      : ''
  }`

      default:
        return ''
    }
  }

  // Copiar código
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Código copiado",
      description: "El código ha sido copiado al portapapeles"
    })
  }

  // Rellenar con datos de ejemplo
  const fillExampleData = () => {
    const newParams: { [key: string]: any } = {}
    
    selectedEndpoint.parameters.forEach(param => {
      if (param.example !== undefined) {
        newParams[param.name] = param.example
      }
    })
    
    setParameters(newParams)
    
    if (selectedEndpoint.bodySchema) {
      const exampleBody: { [key: string]: any } = {}
      Object.entries(selectedEndpoint.bodySchema).forEach(([key, schema]) => {
        if (schema.example !== undefined) {
          exampleBody[key] = schema.example
        }
      })
      setRequestBody(JSON.stringify(exampleBody, null, 2))
    }
    
    toast({
      title: "Datos de ejemplo cargados",
      description: "Se han cargado los datos de ejemplo para este endpoint"
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            API Playground
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Prueba y experimenta con los endpoints de la API de WhatsApp en tiempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fillExampleData}>
            <Zap className="h-4 w-4 mr-2" />
            Cargar Ejemplos
          </Button>
          
          <Button variant="outline" onClick={saveRequest}>
            <Star className="h-4 w-4 mr-2" />
            Guardar Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Endpoints */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endpoints Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <Button
                    key={endpoint.id}
                    variant={selectedEndpoint.id === endpoint.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedEndpoint(endpoint)
                      setParameters({})
                      setRequestBody('')
                      setResponse(null)
                    }}
                  >
                    <Badge 
                      variant={endpoint.method === 'GET' ? 'secondary' : 
                               endpoint.method === 'POST' ? 'default' : 
                               endpoint.method === 'DELETE' ? 'destructive' : 'outline'}
                      className="mr-2 text-xs"
                    >
                      {endpoint.method}
                    </Badge>
                    <span className="truncate">{endpoint.title}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Auth Token */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Autenticación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="authToken">Token de Acceso</Label>
                  <div className="relative">
                    <Input
                      id="authToken"
                      type={showToken ? 'text' : 'password'}
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="Ingresa tu token..."
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {selectedEndpoint.requiresAuth && !authToken && (
                  <div className="flex items-center gap-2 text-yellow-600 text-sm">
                    <Lock className="h-4 w-4" />
                    Este endpoint requiere autenticación
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Endpoint Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Badge 
                      variant={selectedEndpoint.method === 'GET' ? 'secondary' : 
                               selectedEndpoint.method === 'POST' ? 'default' : 
                               selectedEndpoint.method === 'DELETE' ? 'destructive' : 'outline'}
                      className="mr-2"
                    >
                      {selectedEndpoint.method}
                    </Badge>
                    {selectedEndpoint.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {selectedEndpoint.description}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedEndpoint.category}</Badge>
                  {selectedEndpoint.requiresAuth && (
                    <Badge variant="outline">
                      <Lock className="h-3 w-3 mr-1" />
                      Auth Required
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <code className="text-sm">
                  {selectedEndpoint.method} {API_BASE_URL}{selectedEndpoint.path}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Request Configuration */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Request Tab */}
            <TabsContent value="request" className="space-y-4">
              {/* Parameters */}
              {selectedEndpoint.parameters.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Parámetros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedEndpoint.parameters.map((param) => (
                        <div key={param.name} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={param.name}>{param.name}</Label>
                            {param.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{param.type}</Badge>
                          </div>
                          <Input
                            id={param.name}
                            value={parameters[param.name] || ''}
                            onChange={(e) => setParameters(prev => ({
                              ...prev,
                              [param.name]: e.target.value
                            }))}
                            placeholder={param.example?.toString() || `Enter ${param.name}...`}
                          />
                          <p className="text-sm text-muted-foreground">{param.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Request Body */}
              {selectedEndpoint.bodySchema && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Request Body</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        placeholder="Enter JSON request body..."
                        rows={10}
                        className="font-mono text-sm"
                      />
                      
                      {/* Body Schema Info */}
                      <div className="space-y-2">
                        <Label>Schema:</Label>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          {Object.entries(selectedEndpoint.bodySchema).map(([key, schema]) => (
                            <div key={key} className="text-sm mb-2">
                              <code className="font-mono">{key}</code>
                              <span className="text-muted-foreground ml-2">
                                ({schema.type}) - {schema.description}
                                {schema.required && <span className="text-red-500"> *</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Headers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Headers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(customHeaders, null, 2)}
                    onChange={(e) => {
                      try {
                        setCustomHeaders(JSON.parse(e.target.value))
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder="Enter headers as JSON..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* Execute Button */}
              <div className="flex gap-2">
                <Button 
                  onClick={executeRequest} 
                  disabled={isLoading}
                  className="flex-1"
                  size="lg"
                >
                  {isLoading ? (
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5 mr-2" />
                  )}
                  {isLoading ? 'Ejecutando...' : 'Ejecutar Request'}
                </Button>
                
                <Button variant="outline" onClick={() => setResponse(null)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Response Tab */}
            <TabsContent value="response" className="space-y-4">
              {response ? (
                <>
                  {/* Response Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Response Status
                        {response.status >= 200 && response.status < 300 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Status Code</Label>
                          <p className={`text-lg font-mono ${
                            response.status >= 200 && response.status < 300 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {response.status}
                          </p>
                        </div>
                        <div>
                          <Label>Status Text</Label>
                          <p className="text-lg font-mono">{response.statusText}</p>
                        </div>
                        <div>
                          <Label>Response Time</Label>
                          <p className="text-lg font-mono flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {responseTime}ms
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Response Headers */}
                  {response.headers && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Response Headers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-x-auto">
                          {JSON.stringify(response.headers, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  {/* Response Body */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Response Body</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCode(JSON.stringify(response.data || response.error, null, 2))}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(response.data || response.error, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Response Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ejecuta un request para ver la respuesta aquí
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="space-y-4">
              <div className="space-y-4">
                {['javascript', 'python', 'curl'].map((lang) => (
                  <Card key={lang}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg capitalize">{lang}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCode(generateCodeExample(lang as any))}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{generateCodeExample(lang as any)}</code>
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Request History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Request History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requestHistory.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {requestHistory.map((entry) => (
                          <div key={entry.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={entry.success ? 'default' : 'destructive'}>
                                  {entry.method}
                                </Badge>
                                <span className="text-sm font-medium">{entry.endpoint}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {entry.status || 'Error'}
                              </code>
                              {entry.duration && (
                                <span className="text-muted-foreground">
                                  {entry.duration}ms
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No hay historial</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Saved Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Saved Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {savedRequests.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {savedRequests.map((saved) => (
                          <div key={saved.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{saved.name}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadSavedRequest(saved)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newSaved = savedRequests.filter(s => s.id !== saved.id)
                                    setSavedRequests(newSaved)
                                    localStorage.setItem('api_playground_saved', JSON.stringify(newSaved))
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(saved.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No hay requests guardados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}