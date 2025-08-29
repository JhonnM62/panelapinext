"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Lock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Image,
  Video,
  Mic,
  FileText,
  MapPin,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface APIEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  title: string;
  description: string;
  category: string;
  requiresAuth: boolean;
  parameters: {
    name: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    required: boolean;
    description: string;
    example?: any;
    enum?: string[];
  }[];
  bodySchema?: {
    [key: string]: {
      type: string;
      required: boolean;
      description: string;
      example?: any;
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      example: any;
    };
  };
}

interface RequestHistory {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  success: boolean;
  endpoint: string;
}

interface SavedRequest {
  id: string;
  name: string;
  endpoint: APIEndpoint;
  parameters: { [key: string]: any };
  body: string;
  headers: { [key: string]: string };
  createdAt: string;
}

const API_BASE_URL = "https://backend.autosystemprojects.site";

const endpoints: APIEndpoint[] = [
  {
    id: "message-text",
    method: "POST",
    path: "/chats/send",
    title: "Mensaje de Texto",
    description: "Envía un mensaje de texto simple",
    category: "Mensajes",
    requiresAuth: true,
    parameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "ID de la sesión activa",
        example: "mi-bot-session",
      },
    ],
    bodySchema: {
      receiver: {
        type: "string",
        required: true,
        description: "Número de teléfono del destinatario (con código de país)",
        example: "573001234567",
      },
      message: {
        type: "object",
        required: true,
        description: "Contenido del mensaje",
        example: {
          text: "¡Hola! Este es un mensaje de prueba desde la API.",
        },
      },
    },
    responses: {
      "200": {
        description: "Mensaje enviado exitosamente",
        example: {
          success: true,
          message: "Message sent successfully",
          data: {
            messageId: "msg_123456789",
            timestamp: "2024-01-15T10:30:00Z",
          },
        },
      },
    },
  },
  {
    id: "message-image",
    method: "POST",
    path: "/chats/send",
    title: "Mensaje con Imagen",
    description: "Envía una imagen con caption opcional",
    category: "Mensajes",
    requiresAuth: true,
    parameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "ID de la sesión activa",
        example: "mi-bot-session",
      },
    ],
    bodySchema: {
      receiver: {
        type: "string",
        required: true,
        description: "Número de teléfono del destinatario",
        example: "573001234567",
      },
      message: {
        type: "object",
        required: true,
        description: "Datos de la imagen",
        example: {
          image: {
            url: "https://ejemplo.com/imagen.jpg",
            caption: "Esta es una imagen de ejemplo",
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Imagen enviada exitosamente",
        example: {
          success: true,
          message: "Image sent successfully",
          data: {
            messageId: "msg_123456789",
            mediaId: "media_987654321",
          },
        },
      },
    },
  },
  {
    id: "message-video",
    method: "POST",
    path: "/chats/send",
    title: "Mensaje con Video",
    description: "Envía un video con caption opcional",
    category: "Mensajes",
    requiresAuth: true,
    parameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "ID de la sesión activa",
        example: "mi-bot-session",
      },
    ],
    bodySchema: {
      receiver: {
        type: "string",
        required: true,
        description: "Número de teléfono del destinatario",
        example: "573001234567",
      },
      message: {
        type: "object",
        required: true,
        description: "Datos del video",
        example: {
          video: {
            url: "https://ejemplo.com/video.mp4",
            caption: "Video de demostración",
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Video enviado exitosamente",
        example: {
          success: true,
          message: "Video sent successfully",
          data: {
            messageId: "msg_123456789",
            mediaId: "media_987654321",
          },
        },
      },
    },
  },
  {
    id: "message-audio",
    method: "POST",
    path: "/chats/send",
    title: "Mensaje de Audio",
    description: "Envía un archivo de audio o nota de voz",
    category: "Mensajes",
    requiresAuth: true,
    parameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "ID de la sesión activa",
        example: "mi-bot-session",
      },
    ],
    bodySchema: {
      receiver: {
        type: "string",
        required: true,
        description: "Número de teléfono del destinatario",
        example: "573001234567",
      },
      message: {
        type: "object",
        required: true,
        description: "Datos del audio",
        example: {
          audio: {
            url: "https://ejemplo.com/audio.mp3",
            ptt: true,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Audio enviado exitosamente",
        example: {
          success: true,
          message: "Audio sent successfully",
          data: {
            messageId: "msg_123456789",
            mediaId: "media_987654321",
          },
        },
      },
    },
  },
  {
    id: "message-document",
    method: "POST",
    path: "/chats/send",
    title: "Mensaje con Documento",
    description: "Envía un documento (PDF, Word, Excel, etc.)",
    category: "Mensajes",
    requiresAuth: true,
    parameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "ID de la sesión activa",
        example: "mi-bot-session",
      },
    ],
    bodySchema: {
      receiver: {
        type: "string",
        required: true,
        description: "Número de teléfono del destinatario",
        example: "573001234567",
      },
      message: {
        type: "object",
        required: true,
        description: "Datos del documento",
        example: {
          document: {
            url: "https://ejemplo.com/documento.pdf",
            filename: "reporte.pdf",
            caption: "Reporte mensual adjunto",
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Documento enviado exitosamente",
        example: {
          success: true,
          message: "Document sent successfully",
          data: {
            messageId: "msg_123456789",
            mediaId: "media_987654321",
          },
        },
      },
    },
  },
  {
    id: "message-location",
    method: "POST",
    path: "/chats/send",
    title: "Mensaje de Ubicación",
    description: "Envía una ubicación geográfica",
    category: "Mensajes",
    requiresAuth: true,
    parameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "ID de la sesión activa",
        example: "mi-bot-session",
      },
    ],
    bodySchema: {
      receiver: {
        type: "string",
        required: true,
        description: "Número de teléfono del destinatario",
        example: "573001234567",
      },
      message: {
        type: "object",
        required: true,
        description: "Datos de la ubicación",
        example: {
          location: {
            latitude: 4.6097102,
            longitude: -74.0817699,
            name: "Bogotá, Colombia",
            address: "Bogotá, Cundinamarca, Colombia",
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Ubicación enviada exitosamente",
        example: {
          success: true,
          message: "Location sent successfully",
          data: {
            messageId: "msg_123456789",
          },
        },
      },
    },
  },
  {
    id: "groups-create",
    method: "POST",
    path: "/groups/create",
    title: "Crear Grupo",
    description: "Crea un nuevo grupo de WhatsApp",
    category: "Grupos",
    requiresAuth: true,
    parameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "ID de la sesión",
        example: "mi-sesion-bot",
      },
    ],
    bodySchema: {
      groupName: {
        type: "string",
        required: true,
        description: "Nombre del grupo",
        example: "Mi Grupo de Prueba",
      },
      participants: {
        type: "array",
        required: true,
        description: "Lista de participantes (números de teléfono)",
        example: ["+573001234567", "+573007654321"],
      },
    },
    responses: {
      "200": {
        description: "Grupo creado exitosamente",
        example: {
          success: true,
          message: "Group created successfully",
          data: {
            groupId: "120363027219123456@g.us",
          },
        },
      },
    },
  },
  {
    id: "webhook-create",
    method: "POST",
    path: "/webhook/create",
    title: "Crear Webhook",
    description: "Configura un webhook para recibir eventos",
    category: "Webhooks",
    requiresAuth: false,
    parameters: [],
    bodySchema: {
      userId: {
        type: "string",
        required: true,
        description: "ID del usuario",
        example: "user-123",
      },
      sessionId: {
        type: "string",
        required: true,
        description: "ID de la sesión",
        example: "mi-sesion-bot",
      },
      events: {
        type: "array",
        required: true,
        description: "Lista de eventos a escuchar",
        example: ["message.new", "session.status"],
      },
      webhookUrl: {
        type: "string",
        required: false,
        description: "URL del webhook (opcional)",
        example: "https://miapp.com/webhook",
      },
    },
    responses: {
      "200": {
        description: "Webhook creado exitosamente",
        example: {
          success: true,
          message: "Webhook created successfully",
          data: {
            webhookId: "webhook-123",
            webhookUrl: "https://miapp.com/webhook",
          },
        },
      },
    },
  },
];

export default function APIPlaygroundPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint>(
    endpoints[0]
  );
  const [parameters, setParameters] = useState<{ [key: string]: any }>({});
  const [requestBody, setRequestBody] = useState("");
  const [customHeaders, setCustomHeaders] = useState<{ [key: string]: string }>(
    {}
  );
  const [authToken, setAuthToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [activeTab, setActiveTab] = useState("request");
  const [showRequestBody, setShowRequestBody] = useState(true);
  const [showHeaders, setShowHeaders] = useState(false);

  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem("api_playground_token");
    const savedHistory = localStorage.getItem("api_playground_history");
    const savedReqs = localStorage.getItem("api_playground_saved");

    if (savedToken) setAuthToken(savedToken);
    if (savedHistory) setRequestHistory(JSON.parse(savedHistory));
    if (savedReqs) setSavedRequests(JSON.parse(savedReqs));
  }, []);

  // Guardar token cuando cambie
  useEffect(() => {
    if (authToken) {
      localStorage.setItem("api_playground_token", authToken);
    }
  }, [authToken]);

  // Inicializar cuerpo de solicitud con datos de ejemplo cuando cambie el endpoint
  useEffect(() => {
    if (selectedEndpoint.bodySchema) {
      const exampleBody: { [key: string]: any } = {};
      Object.entries(selectedEndpoint.bodySchema).forEach(([key, schema]) => {
        if (schema.example !== undefined) {
          exampleBody[key] = schema.example;
        }
      });
      setRequestBody(JSON.stringify(exampleBody, null, 2));
    } else {
      setRequestBody("");
    }
  }, [selectedEndpoint]);

  // Construir URL completa
  const buildUrl = () => {
    let url = `${API_BASE_URL}${selectedEndpoint.path}`;

    // Agregar query parameters para todos los métodos
    if (Object.keys(parameters).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(parameters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    return url;
  };

  // Ejecutar request
  const executeRequest = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const url = buildUrl();
      const headers: { [key: string]: string } = {
        "Content-Type": "application/json",
        ...customHeaders
      };

      // Agregar token de autenticación si es requerido
      if (selectedEndpoint.requiresAuth && authToken) {
        headers["x-access-token"] = authToken;
      }

      const requestOptions: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };

      // Agregar body para métodos que lo permiten
      if (
        ["POST", "PUT", "PATCH"].includes(selectedEndpoint.method) &&
        requestBody
      ) {
        requestOptions.body = requestBody;
      }

      const response = await fetch(url, requestOptions);
      const responseData = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
      });
      setResponseTime(duration);

      // Agregar al historial
      const historyEntry: RequestHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        method: selectedEndpoint.method,
        url,
        status: response.status,
        duration,
        success: response.ok,
        endpoint: selectedEndpoint.title,
      };

      const newHistory = [historyEntry, ...requestHistory.slice(0, 49)];
      setRequestHistory(newHistory);
      localStorage.setItem(
        "api_playground_history",
        JSON.stringify(newHistory)
      );

      toast({
        title: response.ok ? "Request exitoso" : "Request falló",
        description: `${selectedEndpoint.method} ${url} - ${response.status} (${duration}ms)`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      setResponse({
        status: 0,
        statusText: "Network Error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setResponseTime(duration);

      toast({
        title: "Error de red",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar request
  const saveRequest = () => {
    const savedRequest: SavedRequest = {
      id: Date.now().toString(),
      name: `${selectedEndpoint.method} ${selectedEndpoint.title}`,
      endpoint: selectedEndpoint,
      parameters,
      body: requestBody,
      headers: customHeaders,
      createdAt: new Date().toISOString(),
    };

    const newSaved = [savedRequest, ...savedRequests];
    setSavedRequests(newSaved);
    localStorage.setItem("api_playground_saved", JSON.stringify(newSaved));

    toast({
      title: "Request guardado",
      description: "El request ha sido guardado en favoritos",
    });
  };

  // Cargar request guardado
  const loadSavedRequest = (saved: SavedRequest) => {
    setSelectedEndpoint(saved.endpoint);
    setParameters(saved.parameters);
    setRequestBody(saved.body);
    setCustomHeaders(saved.headers);

    toast({
      title: "Request cargado",
      description: `Se ha cargado "${saved.name}"`,
    });
  };

  // Generar código de ejemplo
  const generateCodeExample = (language: "javascript" | "python" | "curl") => {
    const url = buildUrl();
    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
      ...customHeaders
    };
    if (selectedEndpoint.requiresAuth && authToken) {
      headers["x-access-token"] = authToken;
    }

    switch (language) {
      case "javascript":
        return `// JavaScript/Node.js
const response = await fetch('${url}', {
  method: '${selectedEndpoint.method}',
  headers: ${JSON.stringify(headers, null, 2)},${
          ["POST", "PUT", "PATCH"].includes(selectedEndpoint.method) &&
          requestBody
            ? `\n  body: ${JSON.stringify(requestBody)}`
            : ""
        }
})

const data = await response.json()
console.log(data)`;

      case "python":
        return `# Python
import requests

response = requests.${selectedEndpoint.method.toLowerCase()}(
    '${url}',
    headers=${JSON.stringify(headers, null, 2).replace(/"/g, "'")},${
          ["POST", "PUT", "PATCH"].includes(selectedEndpoint.method) &&
          requestBody
            ? `\n    json=${requestBody}`
            : ""
        }
)

data = response.json()
print(data)`;

      case "curl":
        return `# cURL
curl -X ${selectedEndpoint.method} \\
  '${url}' \\${Object.entries(headers)
          .map(([key, value]) => `\n  -H '${key}: ${value}' \\`)
          .join("")}${
          ["POST", "PUT", "PATCH"].includes(selectedEndpoint.method) &&
          requestBody
            ? `\n  -d '${requestBody}'`
            : ""
        }`;

      default:
        return "";
    }
  };

  // Copiar código
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado",
      description: "El código ha sido copiado al portapapeles",
    });
  };

  // Rellenar con datos de ejemplo
  const fillExampleData = () => {
    const newParams: { [key: string]: any } = {};

    selectedEndpoint.parameters.forEach((param) => {
      if (param.example !== undefined) {
        newParams[param.name] = param.example;
      }
    });

    setParameters(newParams);

    if (selectedEndpoint.bodySchema) {
      const exampleBody: { [key: string]: any } = {};
      Object.entries(selectedEndpoint.bodySchema).forEach(([key, schema]) => {
        if (schema.example !== undefined) {
          exampleBody[key] = schema.example;
        }
      });
      setRequestBody(JSON.stringify(exampleBody, null, 2));
    }

    toast({
      title: "Datos de ejemplo cargados",
      description: "Se han cargado los datos de ejemplo para este endpoint",
    });
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            API Playground
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
            Prueba endpoints de WhatsApp en tiempo real
          </p>
        </div>

        <div className="flex flex-row items-center gap-2">
          <Button variant="outline" onClick={fillExampleData} size="sm" className="text-xs h-7">
            <Zap className="h-3 w-3 mr-1" />
            Ejemplos
          </Button>

          <Button variant="outline" onClick={saveRequest} size="sm" className="text-xs h-7">
            <Star className="h-3 w-3 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Sidebar - Endpoints */}
        <div className="space-y-2 order-2 lg:order-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Endpoints Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Agrupar endpoints por categoría */}
                {Object.entries(
                  endpoints.reduce((acc, endpoint) => {
                    if (!acc[endpoint.category]) {
                      acc[endpoint.category] = [];
                    }
                    acc[endpoint.category].push(endpoint);
                    return acc;
                  }, {} as { [key: string]: typeof endpoints })
                ).map(([category, categoryEndpoints]) => (
                  <div key={category} className="space-y-1">
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 px-1">
                      {category}
                    </h4>
                    <div className="space-y-0.5">
                      {categoryEndpoints.map((endpoint) => {
                        const getIcon = () => {
                          switch (endpoint.id) {
                            case "message-text":
                              return <MessageSquare className="h-4 w-4" />;
                            case "message-image":
                              return <Image className="h-4 w-4" />;
                            case "message-video":
                              return <Video className="h-4 w-4" />;
                            case "message-audio":
                              return <Mic className="h-4 w-4" />;
                            case "message-document":
                              return <FileText className="h-4 w-4" />;
                            case "message-location":
                              return <MapPin className="h-4 w-4" />;
                            default:
                              return <Send className="h-4 w-4" />;
                          }
                        };

                        return (
                          <Button
                            key={endpoint.id}
                            variant={
                              selectedEndpoint.id === endpoint.id
                                ? "default"
                                : "outline"
                            }
                            className="w-full justify-start h-auto py-1.5"
                            onClick={() => {
                              setSelectedEndpoint(endpoint);
                              setParameters({});
                              setResponse(null);
                            }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <div className="hidden sm:block">{getIcon()}</div>
                                <Badge
                                  variant={
                                    endpoint.method === "GET"
                                      ? "secondary"
                                      : endpoint.method === "POST"
                                      ? "default"
                                      : endpoint.method === "DELETE"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {endpoint.method}
                                </Badge>
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">
                                  {endpoint.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                                  {endpoint.description}
                                </div>
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Auth Token */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center">
                <Key className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Autenticación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="space-y-1">
                    <Label htmlFor="authToken" className="text-xs sm:text-sm">Token de Acceso</Label>
                    <div className="relative">
                      <Input
                        id="authToken"
                        type={showToken ? "text" : "password"}
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder="Ingresa tu token..."
                        className="h-8 sm:h-9 text-sm pr-8"
                      />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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
        <div className="lg:col-span-2 space-y-2 sm:space-y-3 order-1 lg:order-2">
          {/* Endpoint Info */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex flex-row items-center gap-2">
                    <Badge
                      variant={
                        selectedEndpoint.method === "GET"
                          ? "secondary"
                          : selectedEndpoint.method === "POST"
                          ? "default"
                          : selectedEndpoint.method === "DELETE"
                          ? "destructive"
                          : "outline"
                      }
                      className="w-fit text-xs"
                    >
                      {selectedEndpoint.method}
                    </Badge>
                    <span className="text-sm sm:text-base">{selectedEndpoint.title}</span>
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs">
                    {selectedEndpoint.description}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="outline" className="text-xs">{selectedEndpoint.category}</Badge>
                  {selectedEndpoint.requiresAuth && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Auth
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg overflow-x-auto">
                <code className="text-xs whitespace-nowrap">
                  {selectedEndpoint.method} {buildUrl()}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Request Configuration */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 h-8">
              <TabsTrigger value="request" className="text-xs">Request</TabsTrigger>
              <TabsTrigger value="response" className="text-xs">Response</TabsTrigger>
              <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            </TabsList>

            {/* Request Tab */}
            <TabsContent value="request" className="space-y-2">
              {/* Parameters */}
              {selectedEndpoint.parameters.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-base">Parámetros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedEndpoint.parameters.map((param) => (
                        <div key={param.name} className="space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <Label htmlFor={param.name} className="text-xs sm:text-sm font-medium">{param.name}</Label>
                            <div className="flex gap-1 sm:gap-2">
                              {param.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {param.type}
                              </Badge>
                            </div>
                          </div>
                          <Input
                            id={param.name}
                            value={parameters[param.name] || ""}
                            onChange={(e) =>
                              setParameters((prev) => ({
                                ...prev,
                                [param.name]: e.target.value,
                              }))
                            }
                            placeholder={
                              param.example?.toString() ||
                              `Enter ${param.name}...`
                            }
                            className="h-8 sm:h-9 text-sm"
                          />
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {param.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Request Body */}
              {selectedEndpoint.bodySchema && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm sm:text-base">Request Body</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRequestBody(!showRequestBody)}
                        className="h-6 w-6 p-0"
                      >
                        {showRequestBody ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {showRequestBody && (
                  <CardContent>
                    <div className="space-y-2">
                      <Textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        placeholder="Enter JSON request body..."
                        rows={6}
                        className="font-mono text-xs"
                      />

                      {/* Body Schema Info */}
                      <div className="space-y-1">
                        <Label className="text-xs">Schema:</Label>
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg overflow-x-auto">
                          {Object.entries(selectedEndpoint.bodySchema).map(
                            ([key, schema]) => (
                              <div key={key} className="text-xs mb-1 break-words">
                                <code className="font-mono">{key}</code>
                                <span className="text-muted-foreground ml-2">
                                  ({schema.type}) - {schema.description}
                                  {schema.required && (
                                    <span className="text-red-500"> *</span>
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  )}
                </Card>
              )}

              {/* Headers */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm sm:text-base">Headers</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHeaders(!showHeaders)}
                      className="h-6 w-6 p-0"
                    >
                      {showHeaders ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {showHeaders && (
                <CardContent>
                  <div className="space-y-2">
                    {/* Default Headers Display */}
                    <div>
                      <Label className="text-xs">Headers por defecto:</Label>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg overflow-x-auto">
                        <pre className="text-xs">
                          {JSON.stringify({
                            "Content-Type": "application/json",
                            ...(selectedEndpoint.requiresAuth && authToken ? { "x-access-token": authToken } : {})
                          }, null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    {/* Custom Headers */}
                    <div>
                      <Label className="text-xs">Headers personalizados:</Label>
                      <Textarea
                        value={JSON.stringify(customHeaders, null, 2)}
                        onChange={(e) => {
                          try {
                            setCustomHeaders(JSON.parse(e.target.value));
                          } catch (error) {
                            // Invalid JSON, don't update
                          }
                        }}
                        placeholder="Enter additional headers as JSON..."
                        rows={3}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
                )}
              </Card>

              {/* Execute Button */}
              <div className="flex flex-row gap-2">
                <Button
                  onClick={executeRequest}
                  disabled={isLoading}
                  className="flex-1 h-8"
                  size="sm"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  )}
                  <span className="text-sm sm:text-base">
                    {isLoading ? "Ejecutando..." : "Ejecutar Request"}
                  </span>
                </Button>

                <Button variant="outline" onClick={() => setResponse(null)} size="sm" className="h-8">
                  <Trash2 className="h-3 w-3" />
                  <span className="ml-1">Limpiar</span>
                </Button>
              </div>
            </TabsContent>

            {/* Response Tab */}
            <TabsContent value="response" className="space-y-2">
              {response ? (
                <>
                  {/* Response Status */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm sm:text-base flex flex-row items-center gap-2">
                        <span>Response Status</span>
                        {response.status >= 200 && response.status < 300 ? (
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Status Code</Label>
                          <p
                            className={`text-sm font-mono ${
                              response.status >= 200 && response.status < 300
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {response.status}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">Status Text</Label>
                          <p className="text-sm font-mono break-words">
                            {response.statusText}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">Response Time</Label>
                          <p className="text-sm font-mono flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {responseTime}ms
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Response Headers */}
                  {response.headers && (
                    <Card>
                      <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">
                          Response Headers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-100 dark:bg-gray-800 p-2 sm:p-3 rounded-lg text-xs sm:text-sm overflow-x-auto">
                          {JSON.stringify(response.headers, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  {/* Response Body */}
                  <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-base sm:text-lg">Response Body</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyCode(
                              JSON.stringify(
                                response.data || response.error,
                                null,
                                2
                              )
                            )
                          }
                          className="w-full sm:w-auto h-8 sm:h-9"
                        >
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          <span className="text-xs sm:text-sm">Copy</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 sm:p-3 rounded-lg text-xs sm:text-sm overflow-x-auto">
                        {JSON.stringify(
                          response.data || response.error,
                          null,
                          2
                        )}
                      </pre>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-8 sm:py-12">
                    <Send className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Response Yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Ejecuta un request para ver la respuesta aquí
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="space-y-4">
              <div className="space-y-4">
                {["javascript", "python", "curl"].map((lang) => (
                  <Card key={lang}>
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-base sm:text-lg capitalize">
                          {lang}
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyCode(generateCodeExample(lang as any))
                          }
                          className="w-full sm:w-auto h-8 sm:h-9"
                        >
                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          <span className="text-xs sm:text-sm">Copy</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-2 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
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
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Request History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {requestHistory.length > 0 ? (
                      <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                        {requestHistory.map((entry) => (
                          <div key={entry.id} className="p-2 sm:p-3 border rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge
                                  variant={
                                    entry.success ? "default" : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {entry.method}
                                </Badge>
                                <span className="text-xs sm:text-sm font-medium truncate">
                                  {entry.endpoint}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {entry.status || "Error"}
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
                      <div className="text-center py-6 sm:py-8">
                        <History className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-500">
                          No hay historial
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Saved Requests */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Saved Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {savedRequests.length > 0 ? (
                      <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                        {savedRequests.map((saved) => (
                          <div key={saved.id} className="p-2 sm:p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs sm:text-sm font-medium truncate pr-2">
                                {saved.name}
                              </span>
                              <div className="flex gap-1 flex-shrink-0">
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
                                    const newSaved = savedRequests.filter(
                                      (s) => s.id !== saved.id
                                    );
                                    setSavedRequests(newSaved);
                                    localStorage.setItem(
                                      "api_playground_saved",
                                      JSON.stringify(newSaved)
                                    );
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
                      <div className="text-center py-6 sm:py-8">
                        <Star className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-500">
                          No hay requests guardados
                        </p>
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
  );
}
