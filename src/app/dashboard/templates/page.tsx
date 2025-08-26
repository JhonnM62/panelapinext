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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TemplatesSkeleton } from '@/components/skeletons';
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Send,
  Eye,
  Save,
  Star,
  Search,
  Filter,
  Image,
  Video,
  FileText,
  MapPin,
  User,
  Calendar,
  Clock,
  Tag,
  PlayCircle,
  BarChart3,
  Sparkles,
  Bot,
  Smartphone,
  Globe,
  Zap,
  Heart,
  TrendingUp,
  Settings,
  Bell,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/auth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { ChatBotsList, ChatBotForm } from "@/components/chatbots";

// 📝 INTERFACES PARA TEMPLATES
interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "marketing"
    | "support"
    | "sales"
    | "notification"
    | "greeting"
    | "custom";
  type:
    | "text"
    | "image"
    | "video"
    | "document"
    | "location"
    | "contact"
    | "poll";
  content: {
    text?: string;
    image?: { url: string; caption?: string };
    video?: { url: string; caption?: string };
    document?: { url: string; fileName: string; mimetype: string };
    location?: { latitude: number; longitude: number; name?: string };
    contact?: { name: string; phone: string; email?: string };
    poll?: { name: string; options: string[]; multiSelect?: boolean };
  };
  variables: string[];
  tags: string[];
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  isActive: boolean;
}

/** 🎨 DATOS MOCK MEJORADOS */
const mockTemplates: MessageTemplate[] = [
  {
    id: "1",
    name: "Bienvenida Cliente Nuevo",
    description: "Mensaje de bienvenida personalizado para nuevos clientes",
    category: "greeting",
    type: "text",
    content: {
      text: "¡Hola {{nombre}}! 👋\n\nBienvenido/a a {{empresa}}. Estamos emocionados de tenerte como parte de nuestra familia.\n\nTu código de cliente es: {{codigo_cliente}}\n\n¿En qué podemos ayudarte hoy?",
    },
    variables: ["nombre", "empresa", "codigo_cliente"],
    tags: ["bienvenida", "nuevo-cliente", "automatico"],
    usageCount: 156,
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    isFavorite: true,
    isActive: true,
  },
  {
    id: "2",
    name: "Confirmación de Pedido",
    description: "Confirmación automática de pedidos con detalles completos",
    category: "notification",
    type: "text",
    content: {
      text: "✅ Pedido Confirmado\n\nHola {{nombre}},\n\nTu pedido #{{numero_pedido}} ha sido confirmado.\n\nTotal: ${{total}}\nFecha estimada de entrega: {{fecha_entrega}}\n\n¡Gracias por tu compra!",
    },
    variables: ["nombre", "numero_pedido", "total", "fecha_entrega"],
    tags: ["pedido", "confirmacion", "ecommerce"],
    usageCount: 342,
    lastUsed: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
    isFavorite: true,
    isActive: true,
  },
  {
    id: "3",
    name: "Soporte Técnico",
    description: "Respuesta automática para consultas de soporte",
    category: "support",
    type: "text",
    content: {
      text: "🛠️ Soporte Técnico\n\nHola {{nombre}},\n\nHemos recibido tu consulta sobre: {{tema}}\n\nTicket #{{ticket}}\n\nTiempo estimado de respuesta: {{tiempo_respuesta}}\n\nNuestro equipo se pondrá en contacto contigo pronto.",
    },
    variables: ["nombre", "tema", "ticket", "tiempo_respuesta"],
    tags: ["soporte", "ticket", "automatico"],
    usageCount: 89,
    lastUsed: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    isFavorite: false,
    isActive: true,
  },
];

// 🎨 CONFIGURACIONES DE CATEGORÍAS Y TIPOS
const categoryOptions = [
  {
    value: "all",
    label: "Todas las categorías",
    icon: MessageSquare,
    color: "gray",
  },
  { value: "marketing", label: "Marketing", icon: BarChart3, color: "blue" },
  { value: "support", label: "Soporte", icon: MessageSquare, color: "green" },
  { value: "sales", label: "Ventas", icon: TrendingUp, color: "purple" },
  {
    value: "notification",
    label: "Notificaciones",
    icon: Bell,
    color: "orange",
  },
  { value: "greeting", label: "Saludos", icon: User, color: "pink" },
  { value: "custom", label: "Personalizado", icon: Star, color: "yellow" },
];



const typeOptions = [
  { value: "text", label: "Texto", icon: MessageSquare },
  { value: "image", label: "Imagen", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Documento", icon: FileText },
  { value: "location", label: "Ubicación", icon: MapPin },
  { value: "contact", label: "Contacto", icon: User },
];

// 🎨 TEMPLATE CARD COMPONENT - Responsive
function TemplateCard({
  template,
  onFavorite,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  template: MessageTemplate;
  onFavorite: (id: string) => void;
  onPreview: (template: MessageTemplate) => void;
  onEdit: (template: MessageTemplate) => void;
  onDuplicate: (template: MessageTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const categoryConfig =
    categoryOptions.find((cat) => cat.value === template.category) ||
    categoryOptions[0];
  const TypeIcon =
    typeOptions.find((t) => t.value === template.type)?.icon || MessageSquare;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div
              className={cn(
                "p-2 rounded-xl flex-shrink-0",
                `bg-${categoryConfig.color}-100 dark:bg-${categoryConfig.color}-900/30`
              )}
            >
              <categoryConfig.icon
                className={cn(
                  "h-5 w-5",
                  `text-${categoryConfig.color}-600 dark:text-${categoryConfig.color}-400`
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold truncate">
                  {template.name}
                </CardTitle>
                {template.isFavorite && (
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                )}
              </div>
              <CardDescription className="mt-1 text-sm">
                {template.description}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFavorite(template.id)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Star
              className={cn(
                "h-4 w-4",
                template.isFavorite
                  ? "text-yellow-500 fill-current"
                  : "text-gray-400"
              )}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Template Preview */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TypeIcon className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {template.type}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {template.content.text}
          </p>
        </div>

        {/* Tags y Variables */}
        <div className="space-y-3">
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {template.variables.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 font-medium">
                Variables:
              </span>
              {template.variables.slice(0, 3).map((variable, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {`{{${variable}}}`}
                </Badge>
              ))}
              {template.variables.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.variables.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Send className="h-3 w-3" />
              {template.usageCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {template.lastUsed
                ? new Date(template.lastUsed).toLocaleDateString()
                : "Nunca"}
            </span>
          </div>
          <Badge
            className={cn(
              "text-xs",
              `bg-${categoryConfig.color}-100 text-${categoryConfig.color}-700 dark:bg-${categoryConfig.color}-900/30 dark:text-${categoryConfig.color}-300`
            )}
          >
            {categoryConfig.label}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(template)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(template)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 🎨 MOBILE FILTER COMPONENT
function MobileFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  showFavoritesOnly,
  setShowFavoritesOnly,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (value: boolean) => void;
}) {
  return (
    <div className="lg:hidden space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar plantillas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className="text-xs"
        >
          <Heart className="h-3 w-3 mr-1" />
          Favoritas
        </Button>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-auto min-w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-auto min-w-[100px] text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {typeOptions.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { user } = useAuthStore();
  const { suscripcion, resourceLimits, loading: planLoading } = usePlanLimits();

  // 📝 ESTADOS PARA TEMPLATES
  const [templates, setTemplates] = useState<MessageTemplate[]>(mockTemplates);
  const [filteredTemplates, setFilteredTemplates] =
    useState<MessageTemplate[]>(mockTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MessageTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState("templates");

  // 📝 EFECTOS PARA TEMPLATES
  useEffect(() => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          template.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (template) => template.category === selectedCategory
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((template) => template.type === selectedType);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((template) => template.isFavorite);
    }

    // Ordenar por favoritos primero, luego por uso
    filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.usageCount - a.usageCount;
    });

    setFilteredTemplates(filtered);
  }, [
    templates,
    searchQuery,
    selectedCategory,
    selectedType,
    showFavoritesOnly,
  ]);

  // 📝 FUNCIONES PARA TEMPLATES
  const toggleFavorite = (templateId: string) => {
    const currentTemplate = templates.find(t => t.id === templateId);
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === templateId
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      )
    );
    toast({
      title: currentTemplate?.isFavorite
        ? "Eliminado de favoritos"
        : "Agregado a favoritos",
      description: "Plantilla actualizada correctamente",
    });
  };

  const handlePreview = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setPreviewData({});
    setIsPreviewDialogOpen(true);
  };

  const handleEdit = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setIsCreateDialogOpen(true);
  };

  const handleDuplicate = (template: MessageTemplate) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copia)`,
      usageCount: 0,
      lastUsed: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false,
    };
    setTemplates((prev) => [newTemplate, ...prev]);
    toast({
      title: "Plantilla duplicada",
      description: "Se creó una copia de la plantilla",
    });
  };

  const handleDelete = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    toast({
      title: "Plantilla eliminada",
      description: "La plantilla se eliminó correctamente",
      variant: "destructive",
    });
  };

  const [loading, setLoading] = useState(true);

  // Simulate loading for initial data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || planLoading) {
    return <TemplatesSkeleton />;
  }

  return (
    <div className="max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* 🎯 HEADER - Super Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
        <div className="space-y-2 px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3 flex-wrap">
        <Bot className="h-8 w-8 lg:h-10 lg:w-10 text-purple-600 flex-shrink-0" />
        <span className="break-words">Chatbots y Mensajes</span>
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
        Crea chatbots inteligentes y gestiona plantillas de mensajes para automatizar
        tus respuestas en WhatsApp. Configura ChatBots con IA para respuestas automáticas.
        </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 px-2 sm:px-0 flex-shrink-0">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11 w-full sm:w-auto min-w-[140px] text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Nueva Plantilla</span>
          </Button>
        </div>
      </div>

      {/* 🎨 TABS - Mobile optimized */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2 sm:px-0">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-lg"
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Mensajes</span>
              <span className="sm:hidden">Msg</span>
            </TabsTrigger>
            <TabsTrigger
              value="bots"
              className="flex items-center gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-lg"
            >
              <Bot className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">ChatBots</span>
              <span className="sm:hidden">Bots</span>
            </TabsTrigger>
          </TabsList>

          {/* Template Stats - Mobile responsive */}
          {activeTab === "templates" && (
            <div className="flex sm:hidden lg:flex gap-2 sm:gap-4 text-xs sm:text-sm justify-center sm:justify-start">
              <div className="text-center">
                <div className="font-bold text-purple-600">
                  {templates.length}
                </div>
                <div className="text-gray-500 text-xs">Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-pink-600">
                  {templates.filter((t) => t.isFavorite).length}
                </div>
                <div className="text-gray-500 text-xs">Favoritas</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">
                  {filteredTemplates.length}
                </div>
                <div className="text-gray-500 text-xs">Mostradas</div>
              </div>
            </div>
          )}
        </div>

        {/* 📄 TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-6">
          {/* 📱 MOBILE FILTERS */}
          <MobileFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
          />

          {/* 💻 DESKTOP FILTERS */}
          <div className="hidden lg:flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border mx-2 lg:mx-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar plantillas por nombre, descripción o etiquetas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48 min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <category.icon className="h-4 w-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40 min-w-[100px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {typeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Favoritas
            </Button>
          </div>

          {/* 📋 TEMPLATES GRID - Perfect responsive */}
          {filteredTemplates.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    No se encontraron plantillas
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ||
                    selectedCategory !== "all" ||
                    selectedType !== "all" ||
                    showFavoritesOnly
                      ? "Intenta ajustar los filtros de búsqueda"
                      : "Comienza creando tu primera plantilla de mensaje"}
                  </p>
                </div>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Plantilla
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onFavorite={toggleFavorite}
                  onPreview={handlePreview}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 🤖 CHATBOTS TAB */}
        <TabsContent value="bots" className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <ChatBotsList />
          </div>
        </TabsContent>


      </Tabs>

      {/* 👁️ PREVIEW DIALOG */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vista Previa: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Previsualiza cómo se verá tu plantilla con datos reales
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Variables Input */}
              {selectedTemplate.variables.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                    Completa las variables para previsualizar:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable}>
                        <Label htmlFor={variable} className="text-sm">
                          {`{{${variable}}}`}
                        </Label>
                        <Input
                          id={variable}
                          placeholder={`Valor para ${variable}`}
                          value={previewData[variable] || ""}
                          onChange={(e) =>
                            setPreviewData((prev) => ({
                              ...prev,
                              [variable]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Mensaje final:
                </h4>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedTemplate.variables.reduce((text, variable) => {
                      const value = previewData[variable] || `{{${variable}}}`;
                      return text.replace(
                        new RegExp(`{{${variable}}}`, "g"),
                        value
                      );
                    }, selectedTemplate.content.text || "")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewDialogOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    // Aquí iría la lógica para enviar el mensaje
                    toast({
                      title: "Función en desarrollo",
                      description:
                        "Próximamente podrás enviar mensajes desde aquí",
                    });
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
