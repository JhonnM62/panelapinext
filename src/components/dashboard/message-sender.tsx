'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Send, 
  MessageSquare, 
  Users, 
  Image, 
  File, 
  Link, 
  MapPin, 
  Smile,
  Upload,
  X,
  Plus,
  Trash2,
  Copy,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  Calendar,
  Clock
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { sessionsAPI } from '@/lib/api'
import { baileysAPI, BaileysAPI } from '@/lib/api'

interface MessageTemplate {
  id: string
  name: string
  content: string
  type: 'text' | 'media' | 'location' | 'contact'
  variables?: string[]
}

interface BulkRecipient {
  id: string
  phone: string
  name?: string
  variables?: Record<string, string>
  status?: 'pending' | 'sent' | 'failed'
  error?: string
}

export default function MessageSenderComponent() {
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [messageType, setMessageType] = useState<'single' | 'bulk'>('single')
  const [contentType, setContentType] = useState<'text' | 'image' | 'document' | 'location' | 'contact'>('text')
  
  // Single message states
  const [recipient, setRecipient] = useState('')
  const [isGroup, setIsGroup] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [fileName, setFileName] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  
  // Bulk message states
  const [bulkRecipients, setBulkRecipients] = useState<BulkRecipient[]>([])
  const [csvText, setCsvText] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  
  // UI states
  const [sending, setSending] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [sendResults, setSendResults] = useState<BulkRecipient[]>([])

  useEffect(() => {
    loadSessions()
    loadTemplates()
  }, [])

  const loadSessions = async () => {
    try {
      // Cargar sesiones reales desde la API
      const response = await sessionsAPI.list()
      if (response.success && response.data && Array.isArray(response.data)) {
        const sessionsData = response.data.map((sessionId: string) => ({
          id: sessionId,
          status: 'authenticated' // Por defecto, luego se puede consultar el estado real
        }))
        setSessions(sessionsData)
        console.log('🔧 [Sessions] Sesiones cargadas:', sessionsData)
      } else {
        console.warn('🔧 [Sessions] No se encontraron sesiones')
        setSessions([])
      }
    } catch (error) {
      console.error('🔧 [Sessions] Error loading sessions:', error)
      // Fallback: mostrar mensaje de error
      setSessions([])
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones. Verifica tu conexión.",
        variant: "destructive",
      })
    }
  }

  const loadTemplates = () => {
    const savedTemplates = localStorage.getItem('message_templates')
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates))
    }
  }

  const saveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la plantilla es requerido",
        variant: "destructive",
      })
      return
    }

    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      content: messageText,
      type: contentType === 'document' || contentType === 'image' ? 'media' : contentType,
      variables: extractVariables(messageText)
    }

    const updatedTemplates = [...templates, newTemplate]
    setTemplates(updatedTemplates)
    localStorage.setItem('message_templates', JSON.stringify(updatedTemplates))
    
    setNewTemplateName('')
    setShowTemplateForm(false)
    
    toast({
      title: "Éxito",
      description: "Plantilla guardada exitosamente",
    })
  }

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g
    const variables: string[] = []
    let match
    
    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }
    
    return variables
  }

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setMessageText(template.content)
      setContentType(template.type === 'media' ? 'image' : template.type)
      setSelectedTemplate(templateId)
    }
  }

  const parseCSV = () => {
    if (!csvText.trim()) {
      toast({
        title: "Error",
        description: "Ingresa los datos CSV",
        variant: "destructive",
      })
      return
    }

    try {
      const lines = csvText.trim().split('\n')
      const recipients: BulkRecipient[] = []
      
      lines.forEach((line, index) => {
        const [phone, name, ...variableValues] = line.split(',').map(s => s.trim())
        
        if (phone) {
          const variables: Record<string, string> = {}
          
          const template = templates.find(t => t.id === selectedTemplate)
          if (template?.variables) {
            template.variables.forEach((varName, i) => {
              variables[varName] = variableValues[i] || ''
            })
          }
          
          recipients.push({
            id: Date.now().toString() + index,
            phone: phone,
            name: name || undefined,
            variables,
            status: 'pending'
          })
        }
      })
      
      setBulkRecipients(recipients)
      
      toast({
        title: "Éxito",
        description: `${recipients.length} destinatarios cargados`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al procesar CSV",
        variant: "destructive",
      })
    }
  }

  const addManualRecipient = () => {
    const phone = prompt('Ingresa el número de teléfono:')
    if (phone) {
      const newRecipient: BulkRecipient = {
        id: Date.now().toString(),
        phone: phone,
        status: 'pending'
      }
      
      setBulkRecipients([...bulkRecipients, newRecipient])
    }
  }

  const removeRecipient = (id: string) => {
    setBulkRecipients(bulkRecipients.filter(r => r.id !== id))
  }

  const replaceVariables = (text: string, variables: Record<string, string>): string => {
    let result = text
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })
    return result
  }

  const sendSingleMessage = async () => {
    if (!selectedSession) {
      toast({
        title: "Error",
        description: "Selecciona una sesión",
        variant: "destructive",
      })
      return
    }

    if (!recipient.trim()) {
      toast({
        title: "Error",
        description: "Ingresa el destinatario",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    
    try {
      console.log('🚀 [DEBUG] Iniciando envío de mensaje...')
      console.log('🚀 [DEBUG] Sesión seleccionada:', selectedSession)
      console.log('🚀 [DEBUG] Destinatario:', recipient)
      console.log('🚀 [DEBUG] Es grupo:', isGroup)
      console.log('🚀 [DEBUG] Tipo de contenido:', contentType)
      console.log('🚀 [DEBUG] Mensaje de texto:', messageText)
      
      let response
      
      // Formatear el número de teléfono correctamente
      const formattedRecipient = isGroup ? recipient : BaileysAPI.formatPhoneNumber(recipient, isGroup)
      console.log('🚀 [DEBUG] Destinatario formateado:', formattedRecipient)
      
      if (contentType === 'text') {
        if (!messageText.trim()) {
          toast({
            title: "Error",
            description: "El mensaje de texto es requerido",
            variant: "destructive",
          })
          return
        }
        
        const messageData = {
          receiver: formattedRecipient,
          isGroup: isGroup,
          message: {
            text: messageText
          }
        }
        
        console.log('🚀 [DEBUG] Payload para API:', JSON.stringify(messageData, null, 2))
        console.log('🚀 [DEBUG] Llamando endpoint: /chats/send?id=' + selectedSession)
        
        response = await baileysAPI.sendTextMessage(selectedSession, messageData)
        
      } else if (contentType === 'image') {
        if (!mediaUrl.trim()) {
          toast({
            title: "Error",
            description: "La URL de la imagen es requerida",
            variant: "destructive",
          })
          return
        }
        
        const messageData = {
          receiver: formattedRecipient,
          isGroup: isGroup,
          message: {
            image: { url: mediaUrl },
            caption: caption || undefined
          }
        }
        
        console.log('🚀 [DEBUG] Payload para API (imagen):', JSON.stringify(messageData, null, 2))
        response = await baileysAPI.sendImageMessage(selectedSession, messageData)
        
      } else if (contentType === 'document') {
        if (!mediaUrl.trim()) {
          toast({
            title: "Error",
            description: "La URL del documento es requerida",
            variant: "destructive",
          })
          return
        }
        
        const messageData = {
          receiver: formattedRecipient,
          isGroup: isGroup,
          message: {
            document: { url: mediaUrl },
            caption: caption || undefined,
            mimetype: 'application/pdf',
            fileName: fileName || 'documento.pdf'
          }
        }
        
        console.log('🚀 [DEBUG] Payload para API (documento):', JSON.stringify(messageData, null, 2))
        response = await baileysAPI.sendDocumentMessage(selectedSession, messageData)
        
      } else if (contentType === 'location') {
        if (!latitude.trim() || !longitude.trim()) {
          toast({
            title: "Error",
            description: "Latitud y longitud son requeridas",
            variant: "destructive",
          })
          return
        }
        
        const messageData = {
          receiver: formattedRecipient,
          isGroup: isGroup,
          message: {
            location: {
              degreesLatitude: parseFloat(latitude),
              degreesLongitude: parseFloat(longitude)
            }
          }
        }
        
        console.log('🚀 [DEBUG] Payload para API (ubicación):', JSON.stringify(messageData, null, 2))
        response = await baileysAPI.sendLocationMessage(selectedSession, messageData)
      }
      
      console.log('🚀 [DEBUG] Respuesta completa del endpoint:', response)
      console.log('🚀 [DEBUG] Success:', response?.success)
      console.log('🚀 [DEBUG] Message:', response?.message)
      console.log('🚀 [DEBUG] Data:', response?.data)
      
      if (response?.success) {
        toast({
          title: "✅ Éxito",
          description: response.message || "Mensaje enviado exitosamente",
        })
        
        // Limpiar formulario
        setRecipient('')
        setMessageText('')
        setMediaUrl('')
        setCaption('')
        setLatitude('')
        setLongitude('')
        setFileName('')
        
        console.log('🚀 [DEBUG] Formulario limpiado exitosamente')
      } else {
        console.error('🚀 [DEBUG] Error en respuesta:', response)
        toast({
          title: "❌ Error",
          description: response?.message || "No se pudo enviar el mensaje",
          variant: "destructive",
        })
      }
      
    } catch (error: any) {
      console.error('🚀 [DEBUG] Error capturado:', error)
      console.error('🚀 [DEBUG] Error stack:', error.stack)
      console.error('🚀 [DEBUG] Error message:', error.message)
      
      toast({
        title: "❌ Error de conexión",
        description: error.message || "No se pudo conectar con el servidor",
        variant: "destructive",
      })
    } finally {
      setSending(false)
      console.log('🚀 [DEBUG] Proceso de envío finalizado')
    }
  }

  const sendBulkMessages = async () => {
    if (!selectedSession) {
      toast({
        title: "Error",
        description: "Selecciona una sesión",
        variant: "destructive",
      })
      return
    }

    if (bulkRecipients.length === 0) {
      toast({
        title: "Error",
        description: "Agrega destinatarios",
        variant: "destructive",
      })
      return
    }

    if (!messageText.trim()) {
      toast({
        title: "Error",
        description: "Ingresa el mensaje",
        variant: "destructive",
      })
      return
    }

    setSending(true)
    setBulkProgress(0)
    
    const results: BulkRecipient[] = []
    const total = bulkRecipients.length
    
    for (let i = 0; i < bulkRecipients.length; i++) {
      const currentRecipient = bulkRecipients[i]
      
      try {
        console.log(`🚀 [BULK DEBUG] Enviando mensaje ${i + 1}/${total} a:`, currentRecipient.phone)
        
        // Formatear el número de teléfono correctamente
        const formattedPhone = BaileysAPI.formatPhoneNumber(currentRecipient.phone, false)
        console.log(`🚀 [BULK DEBUG] Teléfono formateado:`, formattedPhone)
        
        // Reemplazar variables si existen
        let finalMessage = messageText
        if (currentRecipient.variables) {
          finalMessage = replaceVariables(messageText, currentRecipient.variables)
        }
        
        const messageData = {
          receiver: formattedPhone,
          isGroup: false,
          message: {
            text: finalMessage
          }
        }
        
        console.log(`🚀 [BULK DEBUG] Payload:`, JSON.stringify(messageData, null, 2))
        
        const response = await baileysAPI.sendTextMessage(selectedSession, messageData)
        
        console.log(`🚀 [BULK DEBUG] Respuesta para ${currentRecipient.phone}:`, response)
        
        if (response?.success) {
          results.push({ ...currentRecipient, status: 'sent' })
          console.log(`✅ [BULK DEBUG] Mensaje enviado exitosamente a ${currentRecipient.phone}`)
        } else {
          results.push({ 
            ...currentRecipient, 
            status: 'failed', 
            error: response?.message || 'Error desconocido'
          })
          console.error(`❌ [BULK DEBUG] Error enviando a ${currentRecipient.phone}:`, response?.message)
        }
        
        // Pausa entre mensajes para evitar spam
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error: any) {
        console.error(`❌ [BULK DEBUG] Error capturado para ${currentRecipient.phone}:`, error)
        results.push({ 
          ...currentRecipient, 
          status: 'failed', 
          error: error.message || 'Error de conexión' 
        })
      }
      
      setBulkProgress(((i + 1) / total) * 100)
    }
    
    setSendResults(results)
    setSending(false)
    
    const successful = results.filter(r => r.status === 'sent').length
    const failed = results.filter(r => r.status === 'failed').length
    
    toast({
      title: "Envío completado",
      description: `${successful} enviados, ${failed} fallaron`,
      variant: successful > 0 ? "default" : "destructive",
    })
  }

  const exportResults = () => {
    const csv = [
      'Teléfono,Nombre,Estado,Error',
      ...sendResults.map(r => 
        `${r.phone},${r.name || ''},${r.status},${r.error || ''}`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resultados_envio_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Envío de Mensajes</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Envía mensajes individuales o masivos a través de WhatsApp
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {sessions.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="session-select">Sesión:</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar sesión" />
                </SelectTrigger>
                <SelectContent>
                  {sessions
                    .filter(session => session.id && session.id.trim() !== '')
                    .map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {session.id}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay sesiones activas
            </h3>
            <p className="text-gray-500 text-center mb-4">
              Necesitas tener al menos una sesión conectada para enviar mensajes
            </p>
            <Button onClick={loadSessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar Sesiones
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={messageType} onValueChange={(value) => setMessageType(value as 'single' | 'bulk')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensaje Individual
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Envío Masivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle>Mensaje Individual</CardTitle>
                <CardDescription>
                  Envía un mensaje a un contacto específico o grupo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="recipient">Destinatario</Label>
                    <Input
                      id="recipient"
                      placeholder={isGroup ? "ID del grupo (ej: 1234567@g.us)" : "Número de teléfono (ej: +57 300 123 4567)"}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-group"
                        checked={isGroup}
                        onCheckedChange={setIsGroup}
                      />
                      <Label htmlFor="is-group">Es grupo</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Mensaje</Label>
                  <Select value={contentType} onValueChange={(value) => setContentType(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Texto
                        </div>
                      </SelectItem>
                      <SelectItem value="image">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Imagen
                        </div>
                      </SelectItem>
                      <SelectItem value="document">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          Documento
                        </div>
                      </SelectItem>
                      <SelectItem value="location">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Ubicación
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {contentType === 'text' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message-text">Mensaje</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateForm(!showTemplateForm)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Plantilla
                      </Button>
                    </div>
                    <Textarea
                      id="message-text"
                      placeholder="Escribe tu mensaje aquí..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                    />
                    {messageText.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {messageText.length} caracteres
                      </p>
                    )}
                  </div>
                )}

                {contentType === 'image' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image-url">URL de la Imagen</Label>
                      <Input
                        id="image-url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="caption">Descripción (Opcional)</Label>
                      <Textarea
                        id="caption"
                        placeholder="Descripción de la imagen..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {contentType === 'document' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="doc-url">URL del Documento</Label>
                      <Input
                        id="doc-url"
                        placeholder="https://ejemplo.com/documento.pdf"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file-name">Nombre del Archivo</Label>
                      <Input
                        id="file-name"
                        placeholder="documento.pdf"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {contentType === 'location' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitud</Label>
                      <Input
                        id="latitude"
                        placeholder="4.7110"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitud</Label>
                      <Input
                        id="longitude"
                        placeholder="-74.0721"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Plantillas Guardadas</Label>
                    <Select value={selectedTemplate} onValueChange={loadTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plantilla" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates
                          .filter(template => template.id && template.id.trim() !== '')
                          .map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showTemplateForm && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                      <Input
                        id="template-name"
                        placeholder="Mi plantilla"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveTemplate} size="sm">
                        Guardar Plantilla
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowTemplateForm(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={sendSingleMessage} 
                  disabled={sending || !selectedSession}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {sending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {sending ? 'Enviando...' : 'Enviar Mensaje'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Envío Masivo</CardTitle>
                  <CardDescription>
                    Configura tu mensaje y destinatarios para envío en lote
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-message">Mensaje</Label>
                    <Textarea
                      id="bulk-message"
                      placeholder="Hola {{nombre}}, este es un mensaje personalizado..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                    />
                    <p className="text-sm text-gray-500">
                      Usa variables como nombre o empresa para personalizar mensajes
                    </p>
                  </div>

                  {templates.length > 0 && (
                    <div className="space-y-2">
                      <Label>Plantillas para Envío Masivo</Label>
                      <Select value={selectedTemplate} onValueChange={loadTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar plantilla" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates
                            .filter(template => template.id && template.id.trim() !== '')
                            .map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                {template.variables && template.variables.length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    Variables: {template.variables.join(', ')}
                                  </p>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Destinatarios ({bulkRecipients.length})
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={addManualRecipient}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                      {bulkRecipients.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setBulkRecipients([])}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csv-input">Importar desde CSV</Label>
                    <Textarea
                      id="csv-input"
                      placeholder="+573001234567,Juan Pérez,Empresa ABC"
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={6}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Formato: teléfono,nombre,variable1,variable2...
                      </p>
                      <Button onClick={parseCSV} size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Cargar CSV
                      </Button>
                    </div>
                  </div>

                  {bulkRecipients.length > 0 && (
                    <div className="space-y-2">
                      <Label>Destinatarios Cargados</Label>
                      <div className="max-h-64 overflow-y-auto border rounded-lg">
                        {bulkRecipients.map((recipient) => (
                          <div 
                            key={recipient.id}
                            className="flex items-center justify-between p-3 border-b last:border-b-0"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{recipient.phone}</span>
                                {recipient.name && (
                                  <span className="text-gray-500">- {recipient.name}</span>
                                )}
                                <Badge 
                                  variant={
                                    recipient.status === 'sent' ? 'default' : 
                                    recipient.status === 'failed' ? 'destructive' : 
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {recipient.status === 'sent' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {recipient.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                                  {recipient.status || 'pendiente'}
                                </Badge>
                              </div>
                              {recipient.error && (
                                <p className="text-xs text-red-500 mt-1">{recipient.error}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRecipient(recipient.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {sending && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Enviando mensajes...</span>
                        <span className="text-sm text-gray-500">{bulkProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${bulkProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {sendResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Resultados del Envío
                      <Button variant="outline" size="sm" onClick={exportResults}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {sendResults.filter(r => r.status === 'sent').length}
                        </p>
                        <p className="text-sm text-gray-600">Enviados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {sendResults.filter(r => r.status === 'failed').length}
                        </p>
                        <p className="text-sm text-gray-600">Fallaron</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {sendResults.length}
                        </p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={sendBulkMessages}
                disabled={sending || !selectedSession || bulkRecipients.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {sending ? 'Enviando...' : `Enviar a ${bulkRecipients.length} destinatarios`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
