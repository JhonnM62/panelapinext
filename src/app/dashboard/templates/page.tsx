'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  Settings,
  Zap,
  BarChart3,
  Bell,
  Brain,
  Cpu,
  Sparkles
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'
import dynamic from 'next/dynamic'

// Importar el componente dinámicamente para evitar problemas de hydratación
const GeminiConfig = dynamic(() => import('@/components/gemini/gemini-config'), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="flex items-center justify-center p-8">
        <div className="animate-pulse">Cargando configuración de IA...</div>
      </CardContent>
    </Card>
  )
})

interface MessageTemplate {
  id: string
  name: string
  description: string
  category: 'marketing' | 'support' | 'sales' | 'notification' | 'greeting' | 'custom'
  type: 'text' | 'image' | 'video' | 'document' | 'location' | 'contact' | 'poll'
  content: {
    text?: string
    image?: { url: string; caption?: string }
    video?: { url: string; caption?: string }
    document?: { url: string; fileName: string; mimetype: string }
    location?: { latitude: number; longitude: number; name?: string }
    contact?: { name: string; phone: string; email?: string }
    poll?: { name: string; options: string[]; multiSelect?: boolean }
  }
  variables: string[]
  tags: string[]
  usageCount: number
  lastUsed?: string
  createdAt: string
  updatedAt: string
  isFavorite: boolean
  isActive: boolean
}

const mockTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Bienvenida Cliente Nuevo',
    description: 'Mensaje de bienvenida para nuevos clientes',
    category: 'greeting',
    type: 'text',
    content: {
      text: '¡Hola {{nombre}}! 👋\n\nBienvenido/a a {{empresa}}. Estamos emocionados de tenerte como parte de nuestra familia.\n\nTu código de cliente es: {{codigo_cliente}}\n\n¿En qué podemos ayudarte hoy?'
    },
    variables: ['nombre', 'empresa', 'codigo_cliente'],
    tags: ['bienvenida', 'nuevo-cliente', 'automatico'],
    usageCount: 156,
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    isFavorite: true,
    isActive: true
  },
  {
    id: '2',
    name: 'Confirmación de Pedido',
    description: 'Confirmación automática de pedidos',
    category: 'notification',
    type: 'text',
    content: {
      text: '✅ Pedido Confirmado\n\nHola {{nombre}},\n\nTu pedido #{{numero_pedido}} ha sido confirmado.\n\nTotal: ${{total}}\nFecha estimada de entrega: {{fecha_entrega}}\n\n¡Gracias por tu compra!'
    },
    variables: ['nombre', 'numero_pedido', 'total', 'fecha_entrega'],
    tags: ['pedido', 'confirmacion', 'ecommerce'],
    usageCount: 342,
    lastUsed: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
    isFavorite: true,
    isActive: true
  }
]

const categoryOptions = [
  { value: 'all', label: 'Todas las categorías', icon: MessageSquare },
  { value: 'marketing', label: 'Marketing', icon: BarChart3 },
  { value: 'support', label: 'Soporte', icon: Settings },
  { value: 'sales', label: 'Ventas', icon: Zap },
  { value: 'notification', label: 'Notificaciones', icon: Bell },
  { value: 'greeting', label: 'Saludos', icon: User },
  { value: 'custom', label: 'Personalizado', icon: Star }
]

const typeOptions = [
  { value: 'text', label: 'Texto', icon: MessageSquare },
  { value: 'image', label: 'Imagen', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'document', label: 'Documento', icon: FileText },
  { value: 'location', label: 'Ubicación', icon: MapPin },
  { value: 'contact', label: 'Contacto', icon: User }
]

export default function TemplatesPage() {
  const { user } = useAuthStore()
  const [templates, setTemplates] = useState<MessageTemplate[]>(mockTemplates)
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>(mockTemplates)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{ [key: string]: string }>({})
  const [activeTab, setActiveTab] = useState('templates')

  useEffect(() => {
    let filtered = templates

    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.type === selectedType)
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite)
    }

    filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return b.usageCount - a.usageCount
    })

    setFilteredTemplates(filtered)
  }, [templates, searchQuery, selectedCategory, selectedType, showFavoritesOnly])

  const toggleFavorite = (templateId: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === templateId
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      )
    )
    toast({
      title: "Template actualizado",
      description: "El template ha sido marcado/desmarcado como favorito",
    })
  }

  const duplicateTemplate = (template: MessageTemplate) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copia)`,
      usageCount: 0,
      lastUsed: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: false
    }
    
    setTemplates(prev => [newTemplate, ...prev])
    toast({
      title: "Template duplicado",
      description: `Se ha creado una copia de "${template.name}"`,
    })
  }

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId))
    toast({
      title: "Template eliminado",
      description: "El template ha sido eliminado exitosamente",
    })
  }

  const useTemplate = (templateId: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === templateId
          ? { 
              ...template, 
              usageCount: template.usageCount + 1,
              lastUsed: new Date().toISOString()
            }
          : template
      )
    )
    
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setIsPreviewDialogOpen(true)
    }
  }

  const previewTemplate = (template: MessageTemplate, data: { [key: string]: string }) => {
    let text = template.content.text || template.content.image?.caption || template.content.video?.caption || ''
    
    template.variables.forEach(variable => {
      const value = data[variable] || `{{${variable}}}`
      text = text.replace(new RegExp(`{{${variable}}}`, 'g'), value)
    })
    
    return text
  }

  const getCategoryIcon = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category)
    return option?.icon || MessageSquare
  }

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type)
    return option?.icon || MessageSquare
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`
    if (diff < 2592000000) return `Hace ${Math.floor(diff / 86400000)} días`
    return formatDate(dateString)
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Templates y ChatBot IA
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Crea plantillas de mensajes y configura tu asistente inteligente con Gemini IA
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'templates' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Template
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Templates de Mensajes
          </TabsTrigger>
          <TabsTrigger value="gemini" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            ChatBot con IA
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Favoritos</p>
                <p className="text-2xl font-bold">{templates.filter(t => t.isFavorite).length}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Más Usado</p>
                <p className="text-2xl font-bold">{Math.max(...templates.map(t => t.usageCount))}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uso Total</p>
                <p className="text-2xl font-bold">{templates.reduce((sum, t) => sum + t.usageCount, 0)}</p>
              </div>
              <Send className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mostrar</label>
              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="w-full"
              >
                <Star className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                Solo Favoritos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const CategoryIcon = getCategoryIcon(template.category)
          const TypeIcon = getTypeIcon(template.type)
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(template.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Star className={`h-4 w-4 ${template.isFavorite ? 'fill-current text-yellow-500' : 'text-muted-foreground'}`} />
                  </Button>
                </div>
                
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.content.text || template.content.image?.caption || template.content.video?.caption || 'Contenido multimedia'}
                    </p>
                  </div>
                  
                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                        {template.variables.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {template.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {template.usageCount} usos
                    </span>
                    {template.lastUsed && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(template.lastUsed)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => useTemplate(template.id)}
                      className="flex-1"
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Usar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setIsPreviewDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No se encontraron templates
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Intenta ajustar los filtros o crear un nuevo template
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Template
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview del Template</DialogTitle>
            <DialogDescription>
              Completa las variables para ver el resultado final
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.variables.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Variables:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable} className="space-y-1">
                        <label className="text-sm font-medium">{variable}</label>
                        <Input
                          placeholder={`Valor para ${variable}`}
                          value={previewData[variable] || ''}
                          onChange={(e) => setPreviewData(prev => ({
                            ...prev,
                            [variable]: e.target.value
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <h4 className="font-medium">Preview:</h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="whitespace-pre-wrap">
                    {previewTemplate(selectedTemplate, previewData)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensaje
                </Button>
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar como Borrador
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Gemini IA Tab */}
        <TabsContent value="gemini" className="space-y-6">
          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-medium text-purple-900 dark:text-purple-100">ChatBot Inteligente con Gemini IA</h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Configura tu asistente de inteligencia artificial para responder automáticamente 
                    a los mensajes de WhatsApp con tecnología de Google Gemini.
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      • <strong>Respuestas naturales:</strong> IA conversacional avanzada
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      • <strong>Contexto inteligente:</strong> Recuerda conversaciones previas
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      • <strong>Personalización:</strong> Configura el comportamiento según tu negocio
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {user && (
            <GeminiConfig 
              userToken={user.token} 
              onConfigSaved={() => {
                toast({
                  title: "Configuración guardada",
                  description: "Tu ChatBot IA ha sido configurado exitosamente",
                })
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
