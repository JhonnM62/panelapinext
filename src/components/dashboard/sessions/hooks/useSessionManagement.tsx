'use client'

import { useState, useEffect, useRef } from 'react'
import { Session, SessionFormData, VerificationData, QRCodeData } from '../types'
import { sessionsAPI } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'
import { mapBackendStatus } from '../sessionUtils'

export function useSessionManagement() {
  const { user } = useAuthStore()
  
  // Estados principales
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  
  // Estados para formulario
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<SessionFormData>({
    sessionName: '',
    authType: 'qr',
    phoneNumber: '',
    webhookUrl: ''
  })
  
  // Estados para selección múltiple
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectAllMode, setSelectAllMode] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  
  // Estados para confirmaciones
  const [showInactiveConfirmation, setShowInactiveConfirmation] = useState(false)
  const [showAuthenticatedConfirmation, setShowAuthenticatedConfirmation] = useState(false)
  
  // Estados para verificación
  const [verificationData, setVerificationData] = useState<VerificationData>({
    code: null,
    sessionId: null,
    sessionName: null,
    phoneNumber: null,
    expiryTime: null,
    timeRemaining: 30,
    copied: false,
    requesting: false
  })
  
  // Estados para QR
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null)
  const [qrPollingActive, setQrPollingActive] = useState(false)
  
  // Estados para modal
  const [modalSessionStatus, setModalSessionStatus] = useState('connecting')
  const [modalSessionAuthenticated, setModalSessionAuthenticated] = useState(false)
  
  // Referencias para timers (usando useRef para cleanup correcto)
  const statusPollingInterval = useRef<NodeJS.Timeout | null>(null)
  const verificationTimer = useRef<NodeJS.Timeout | null>(null)
  
  // Flags de control para evitar múltiple polling
  const isStatusPollingActive = useRef(false)
  const isQRPollingActive = useRef(false)
  const isCodePollingActive = useRef(false)
  const isRegenerating = useRef(false) // Flag para regeneración
  
  // Función para iniciar el temporizador del código de verificación
  const startVerificationTimer = () => {
    // Limpiar timer anterior si existe
    if (verificationTimer.current) {
      clearInterval(verificationTimer.current)
      verificationTimer.current = null
    }
    
    // Iniciar countdown de 30 segundos
    let timeLeft = 30
    setVerificationData(prev => ({ ...prev, timeRemaining: timeLeft }))
    
    const timer = setInterval(() => {
      timeLeft -= 1
      setVerificationData(prev => ({ ...prev, timeRemaining: timeLeft }))
      
      if (timeLeft <= 0) {
        clearInterval(timer)
        verificationTimer.current = null
        console.log('[VERIFICATION-TIMER] Código expirado')
      }
    }, 1000)
    
    verificationTimer.current = timer
    console.log('[VERIFICATION-TIMER] Temporizador iniciado')
  }
  
  // Función para regenerar código de verificación
  const regenerateVerificationCode = async () => {
    if (!verificationData.sessionId || verificationData.requesting) return
    
    setVerificationData(prev => ({ ...prev, requesting: true }))
    isRegenerating.current = true
    
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No hay token de autenticación')
      
      console.log('[REGENERATE-CODE] Iniciando regeneración de código')
      console.log('[REGENERATE-CODE] Sesión actual:', verificationData.sessionId)
      
      // 0️⃣ DETENER POLLING ACTUAL PRIMERO
      console.log('[REGENERATE-CODE] Paso 0: Deteniendo polling actual')
      if (statusPollingInterval.current) {
        clearInterval(statusPollingInterval.current)
        statusPollingInterval.current = null
      }
      isStatusPollingActive.current = false
      
      // 1️⃣ ELIMINAR SESIÓN ACTUAL
      console.log('[REGENERATE-CODE] Paso 1: Eliminando sesión actual')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token,
          sesionId: verificationData.sessionId
        })
      })
      
      // ⏱️ DELAY PARA EVITAR CONFLICTOS DE CONCURRENCIA
      console.log('[REGENERATE-CODE] Esperando para evitar conflictos...')
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 segundos
      
      // 2️⃣ CREAR NUEVA SESIÓN CON LOS MISMOS DATOS
      console.log('[REGENERATE-CODE] Paso 2: Creando nueva sesión')
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token,
          nombresesion: `${verificationData.sessionName}_${Date.now()}`, // Nombre único
          lineaWhatsApp: verificationData.phoneNumber,
          tipoAuth: 'code',
          crearWebhook: false
        })
      })
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Error creando sesión: ${errorText}`)
      }
      
      const createData = await createResponse.json()
      console.log('[REGENERATE-CODE] Sesión creada:', createData)
      
      if (!createData.success) {
        throw new Error(createData.message || 'Error creando nueva sesión')
      }
      
      const newSessionId = createData.data?.sesionId || createData.data?.id
      console.log('[REGENERATE-CODE] Nueva sesión ID:', newSessionId)
      
      // 3️⃣ BUSCAR CÓDIGO EN RESPUESTA INMEDIATA
      const possibleCodeLocations = [
        createData.data?.pairingCode,
        createData.data?.code,
        createData.pairingCode,
        createData.code,
        createData.data?.baileysResponse?.data?.code,
        createData.data?.baileysResponse?.data?.pairingCode
      ]
      
      const immediateCode = possibleCodeLocations.find(c => c && typeof c === 'string')
      
      if (immediateCode) {
        console.log('[REGENERATE-CODE] Código encontrado inmediatamente:', immediateCode)
        
        // 4️⃣ ACTUALIZAR MODAL SIN CERRARLO
        setVerificationData({
          code: immediateCode,
          sessionId: newSessionId,
          sessionName: verificationData.sessionName, // Mantener nombre original
          phoneNumber: verificationData.phoneNumber,
          expiryTime: Date.now() + 30000,
          timeRemaining: 30,
          copied: false,
          requesting: false
        })
        
        // 5️⃣ REINICIAR TEMPORIZADOR
        startVerificationTimer()
        
        toast({
          title: "Código Regenerado",
          description: "Nuevo código generado exitosamente",
          variant: "default"
        })
        
        // 6️⃣ INICIAR MONITOREO CON NUEVA SESIÓN
        console.log('[REGENERATE-CODE] Iniciando monitoreo de nueva sesión')
        pollSessionStatus(newSessionId)
        
      } else {
        // Si no hay código inmediato, hacer polling
        console.log('[REGENERATE-CODE] Código no inmediato, iniciando polling')
        
        setVerificationData(prev => ({
          ...prev,
          code: 'polling',
          sessionId: newSessionId,
          sessionName: verificationData.sessionName,
          requesting: true
        }))
        
        // Iniciar polling para el nuevo código
        isCodePollingActive.current = false
        await pollForPairingCode(newSessionId, verificationData.sessionName!, verificationData.phoneNumber!)
      }
      
    } catch (error) {
      console.error('[REGENERATE-CODE] Error:', error)
      
      setVerificationData(prev => ({ ...prev, requesting: false }))
      
      // Mensajes de error más específicos
      let errorMessage = "No se pudo regenerar el código"
      if (error instanceof Error) {
        if (error.message.includes('parallel')) {
          errorMessage = "Error de concurrencia. Intenta nuevamente en unos segundos."
        } else if (error.message.includes('Can\'t save')) {
          errorMessage = "El sistema está ocupado. Intenta nuevamente."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      // Desactivar flag de regeneración después de un delay
      setTimeout(() => {
        isRegenerating.current = false
        console.log('[REGENERATE-CODE] Flag de regeneración desactivado')
      }, 10000) // 10 segundos de gracia
    }
  }
  
  // Función para regenerar QR
  const regenerateQRCode = async () => {
    if (!qrCodeData?.sessionId || qrPollingActive) return
    
    setQrPollingActive(true)
    isRegenerating.current = true
    
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No hay token de autenticación')
      
      console.log('[REGENERATE-QR] Iniciando regeneración de QR')
      console.log('[REGENERATE-QR] Sesión actual:', qrCodeData.sessionId)
      
      // 0️⃣ DETENER POLLING ACTUAL PRIMERO
      console.log('[REGENERATE-QR] Paso 0: Deteniendo polling actual')
      if (statusPollingInterval.current) {
        clearInterval(statusPollingInterval.current)
        statusPollingInterval.current = null
      }
      isStatusPollingActive.current = false
      
      // 1️⃣ ELIMINAR SESIÓN ACTUAL
      console.log('[REGENERATE-QR] Paso 1: Eliminando sesión actual')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token,
          sesionId: qrCodeData.sessionId
        })
      })
      
      // ⏱️ DELAY PARA EVITAR CONFLICTOS DE CONCURRENCIA
      console.log('[REGENERATE-QR] Esperando para evitar conflictos...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 2️⃣ CREAR NUEVA SESIÓN CON LOS MISMOS DATOS
      console.log('[REGENERATE-QR] Paso 2: Creando nueva sesión')
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token,
          nombresesion: `${qrCodeData.sessionName}_${Date.now()}`,
          lineaWhatsApp: qrCodeData.phoneNumber || undefined,
          tipoAuth: 'qr',
          crearWebhook: false
        })
      })
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Error creando sesión: ${errorText}`)
      }
      
      const createData = await createResponse.json()
      console.log('[REGENERATE-QR] Sesión creada:', createData)
      
      if (!createData.success) {
        throw new Error(createData.message || 'Error creando nueva sesión')
      }
      
      const newSessionId = createData.data?.sesionId || createData.data?.id
      console.log('[REGENERATE-QR] Nueva sesión ID:', newSessionId)
      
      // 3️⃣ BUSCAR QR EN RESPUESTA INMEDIATA
      const possibleQRLocations = [
        createData.data?.baileysResponse?.data?.qrcode,
        createData.data?.baileysResponse?.qrcode,
        createData.data?.qrcode,
        createData.data?.qr,
        createData.baileysResponse?.data?.qrcode,
        createData.baileysResponse?.qrcode,
        createData.qrcode,
        createData.qr
      ]
      
      const immediateQR = possibleQRLocations.find(q => q && typeof q === 'string')
      
      if (immediateQR) {
        console.log('[REGENERATE-QR] QR encontrado inmediatamente')
        
        // 4️⃣ ACTUALIZAR MODAL SIN CERRARLO
        setQrCodeData({
          sessionId: newSessionId,
          sessionName: qrCodeData.sessionName,
          qrCode: immediateQR,
          phoneNumber: qrCodeData.phoneNumber
        })
        
        setQrPollingActive(false)
        
        toast({
          title: "QR Regenerado",
          description: "Nuevo QR generado exitosamente",
          variant: "default"
        })
        
        // 5️⃣ INICIAR MONITOREO CON NUEVA SESIÓN
        console.log('[REGENERATE-QR] Iniciando monitoreo de nueva sesión')
        pollSessionStatus(newSessionId)
        
      } else {
        // Si no hay QR inmediato, hacer polling
        console.log('[REGENERATE-QR] QR no inmediato, iniciando polling')
        
        setQrCodeData({
          sessionId: newSessionId,
          sessionName: qrCodeData.sessionName,
          qrCode: 'polling',
          phoneNumber: qrCodeData.phoneNumber
        })
        
        // Iniciar polling para el nuevo QR
        isQRPollingActive.current = false
        await pollForQRCode(newSessionId, qrCodeData.sessionName, qrCodeData.phoneNumber || '')
      }
      
    } catch (error) {
      console.error('[REGENERATE-QR] Error:', error)
      
      setQrPollingActive(false)
      
      // Mensajes de error más específicos
      let errorMessage = "No se pudo regenerar el QR"
      if (error instanceof Error) {
        if (error.message.includes('parallel')) {
          errorMessage = "Error de concurrencia. Intenta nuevamente en unos segundos."
        } else if (error.message.includes('Can\'t save')) {
          errorMessage = "El sistema está ocupado. Intenta nuevamente."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setTimeout(() => {
        isRegenerating.current = false
        console.log('[REGENERATE-QR] Flag de regeneración desactivado')
      }, 10000)
    }
  }
  const loadSessions = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      const response = await sessionsAPI.listForUser(token)
      
      if (response.success) {
        const sessionsData = Array.isArray(response.data?.sesiones) ? response.data.sesiones : []
        
        if (sessionsData.length === 0) {
          setSessions([])
          return
        }
        
        const enhancedSessions = await Promise.all(
          sessionsData.map(async (sessionData: any) => {
            const sessionId = sessionData.id || sessionData.sesionId || sessionData.nombresesion
            
            const baseSession: Session = {
              id: sessionId,
              status: mapBackendStatus(sessionData.estadoSesion || sessionData.estado || 'disconnected'),
              authenticated: sessionData.estadoSesion === 'authenticated' || sessionData.authenticated === true,
              phoneNumber: sessionData.lineaWhatsApp || sessionData.phoneNumber,
              createdAt: sessionData.fechaCreacion || sessionData.createdAt,
              updatedAt: sessionData.fechaActualizacion || sessionData.updatedAt,
              lastActivity: sessionData.fechaActualizacion || new Date().toISOString()
            }
            
            return baseSession
          })
        )
        
        setSessions(enhancedSessions.filter(Boolean))
      } else {
        setSessions([])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }
  
  // Crear sesión
  const createSession = async () => {
    if (!formData.sessionName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la sesión es requerido",
        variant: "destructive"
      })
      return
    }
    
    if (formData.authType === 'code' && !formData.phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "El número de teléfono es requerido para autenticación por código",
        variant: "destructive"
      })
      return
    }
    
    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      const requestBody = {
        token,
        nombresesion: formData.sessionName,
        lineaWhatsApp: formData.phoneNumber.trim() || undefined,
        tipoAuth: formData.authType,
        crearWebhook: !!formData.webhookUrl.trim()
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const responseData = await response.json()
      
      if (responseData.success) {
        const sessionId = responseData.data?.sesionId || responseData.data?.id || formData.sessionName
        console.log('[CREATE-SESSION] Sesión creada con ID:', sessionId)
        console.log('[CREATE-SESSION] Respuesta completa:', responseData)
        console.log('[CREATE-SESSION] *** ANALIZANDO RESPUESTA INICIAL ***')
        console.log('[CREATE-SESSION] responseData.data:', JSON.stringify(responseData.data, null, 2))
        console.log('[CREATE-SESSION] *** FIN ANÁLISIS ***')
        
        // Manejar respuesta según tipo de autenticación
        if (formData.authType === 'code') {
          console.log('[CREATE-SESSION] Procesando autenticación por código')
          
          // ✅ BUSCAR CÓDIGO DIRECTAMENTE EN RESPUESTA DE CREACIÓN PRIMERO
          const possibleCodeLocations = [
            // 🎯 UBICACIONES PRINCIPALES según nuevo backend
            responseData.data?.pairingCode,
            responseData.data?.code,
            responseData.pairingCode,
            responseData.code,
            
            // 🔄 UBICACIONES ALTERNATIVAS para compatibilidad
            responseData.data?.pairCode,
            responseData.data?.verificationCode,
            responseData.pairCode,
            responseData.verificationCode,
            
            // 🛠️ UBICACIONES DE BAILEYS
            responseData.data?.baileysResponse?.data?.code,
            responseData.data?.baileysResponse?.data?.pairingCode,
            responseData.data?.baileysResponse?.code,
            responseData.data?.baileysResponse?.pairingCode,
            responseData.baileysResponse?.data?.code,
            responseData.baileysResponse?.data?.pairingCode,
            responseData.baileysResponse?.code,
            responseData.baileysResponse?.pairingCode
          ]
          
          const immediateCode = possibleCodeLocations.find(c => c && typeof c === 'string')
          
          // Debug: mostrar qué se encontró en la respuesta inicial
          console.log('[CREATE-SESSION] ✨ DEBUGGING UBICACIONES INICIALES ✨')
          possibleCodeLocations.forEach((location, index) => {
            if (location !== undefined && location !== null) {
              console.log(`[CREATE-SESSION] Ubicación inicial ${index}: ${location} (tipo: ${typeof location})`)
            }
          })
          console.log('[CREATE-SESSION] ✨ FIN DEBUGGING INICIAL ✨')
          
          if (immediateCode) {
            console.log('[CREATE-SESSION] ✅ Código encontrado inmediatamente en respuesta de creación:', immediateCode)
            setVerificationData({
              code: immediateCode,
              sessionId,
              sessionName: formData.sessionName,
              phoneNumber: formData.phoneNumber,
              expiryTime: Date.now() + 30000,
              timeRemaining: 30,
              copied: false,
              requesting: false
            })
            
            // Iniciar temporizador para el código
            startVerificationTimer()
            
            // Iniciar monitoreo del estado inmediatamente
            console.log('[CREATE-SESSION] Iniciando monitoreo de estado inmediato')
            pollSessionStatus(sessionId)
          } else if (responseData.data?.codeInstructions) {
            console.log('[CREATE-SESSION] ⏳ Código no encontrado inmediatamente, usando codeInstructions')
            // Usar las nuevas instrucciones para código
            setVerificationData({
              code: 'polling',
              sessionId,
              sessionName: formData.sessionName,
              phoneNumber: formData.phoneNumber,
              expiryTime: null,
              timeRemaining: 30,
              copied: false,
              requesting: true
            })
            
            pollForPairingCode(sessionId, formData.sessionName, formData.phoneNumber)
          } else {
            console.log('[CREATE-SESSION] ⚠️ Respuesta inesperada para código, iniciando polling como fallback')
            // Fallback - iniciar polling
            setVerificationData({
              code: 'polling',
              sessionId,
              sessionName: formData.sessionName,
              phoneNumber: formData.phoneNumber,
              expiryTime: null,
              timeRemaining: 30,
              copied: false,
              requesting: true
            })
            
            pollForPairingCode(sessionId, formData.sessionName, formData.phoneNumber)
          }
        } else {
          console.log('[CREATE-SESSION] Procesando autenticación por QR')
          
          // Buscar QR inmediato en la respuesta
          const possibleQRLocations = [
            responseData.data?.baileysResponse?.data?.qrcode,
            responseData.data?.baileysResponse?.qrcode,
            responseData.data?.qrcode,
            responseData.data?.qr,
            responseData.baileysResponse?.data?.qrcode,
            responseData.baileysResponse?.qrcode,
            responseData.qrcode,
            responseData.qr
          ]
          
          const qrCode = possibleQRLocations.find(q => q && typeof q === 'string')
          
          if (qrCode) {
            console.log('[CREATE-SESSION] QR encontrado inmediatamente')
            setQrCodeData({
              sessionId,
              sessionName: formData.sessionName,
              qrCode,
              phoneNumber: formData.phoneNumber
            })
            
            // Iniciar monitoreo del estado inmediatamente
            console.log('[CREATE-SESSION] Iniciando monitoreo de estado inmediato')
            pollSessionStatus(sessionId)
          } else {
            console.log('[CREATE-SESSION] QR no encontrado, iniciando polling')
            // Iniciar polling para obtener el QR
            setQrCodeData({
              sessionId,
              sessionName: formData.sessionName,
              qrCode: 'polling',
              phoneNumber: formData.phoneNumber
            })
            
            setQrPollingActive(true)
            pollForQRCode(sessionId, formData.sessionName, formData.phoneNumber)
          }
        }
        
        setShowCreateForm(false)
        resetFormData()
        
        toast({
          title: "Éxito",
          description: "Sesión creada exitosamente"
        })
        
        loadSessions(true)
      } else {
        throw new Error(responseData.message || 'Error creando sesión')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la sesión",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }
  
  // Función para monitorear el estado de la sesión en tiempo real
  const pollSessionStatus = async (sessionId: string) => {
    // ✅ PREVENIR MÚLTIPLE POLLING DEL MISMO sessionId
    if (isStatusPollingActive.current) {
      console.log('[STATUS-POLLING] ⚠️ Ya hay polling activo, evitando duplicado')
      return
    }
    
    console.log('[STATUS-POLLING] Iniciando monitoreo de estado para:', sessionId)
    isStatusPollingActive.current = true
    
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.log('[STATUS-POLLING] No hay token, deteniendo polling')
          stopStatusPolling()
          return
        }
        
        const statusEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/${sessionId}/status`
        console.log(`[STATUS-POLLING] 🔍 Consultando estado desde: ${statusEndpoint}`)
        
        const response = await fetch(statusEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          console.warn(`[STATUS-POLLING] ⚠️ Error HTTP ${response.status} en endpoint de estado`)
          return
        }
        
        const statusData = await response.json()
        console.log(`[STATUS-POLLING] ✅ Estado obtenido exitosamente:`, statusData)
        
        // Buscar estado en diferentes ubicaciones posibles
        const possibleStatusLocations = [
          statusData.data?.estadoSesion,
          statusData.data?.estado,
          statusData.data?.status,
          statusData.data?.baileysResponse?.data?.estado,
          statusData.data?.session?.estado,
          statusData.estadoSesion,
          statusData.estado,
          statusData.status
        ]
        
        const backendStatus = possibleStatusLocations.find(s => s && typeof s === 'string') || 'connecting'
        const mappedStatus = mapBackendStatus(backendStatus)
        
        // Buscar indicadores de autenticación
        const possibleAuthLocations = [
          statusData.data?.authenticated,
          statusData.data?.autenticado,
          statusData.data?.baileysResponse?.data?.authenticated,
          statusData.data?.session?.authenticated,
          statusData.authenticated,
          statusData.autenticado
        ]
        
        const isAuthenticated = backendStatus === 'autenticada' || 
                               backendStatus === 'conectada' ||
                               backendStatus === 'authenticated' ||
                               possibleAuthLocations.some(auth => auth === true)
        
        console.log('[STATUS-POLLING] Estado mapeado:', mappedStatus, 'Autenticado:', isAuthenticated, 'Estado original:', backendStatus)
        
        setModalSessionStatus(mappedStatus)
        setModalSessionAuthenticated(isAuthenticated)
        
        // ✅ CERRAR MODALES AUTOMÁTICAMENTE CUANDO SE AUTENTICA (SOLO SI NO ESTÁ REGENERANDO)
        if (isAuthenticated && !isRegenerating.current) {
          console.log('[STATUS-POLLING] ¡Sesión autenticada! Cerrando modales')
          
          // ✅ DETENER POLLING INMEDIATAMENTE
          stopStatusPolling()
          
          toast({
            title: "¡Éxito!",
            description: "Sesión autenticada exitosamente",
            variant: "default"
          })
          
          // Cerrar modales tras breve delay
          setTimeout(() => {
            console.log('[STATUS-POLLING] Ejecutando cierre de modales')
            closeVerificationModal()
            closeQRModal()
            loadSessions()
          }, 800)
          
          return
        } else if (isAuthenticated && isRegenerating.current) {
          // Si está regenerando, solo detener el polling pero no cerrar modal
          console.log('[STATUS-POLLING] Sesión autenticada durante regeneración - solo deteniendo polling')
          stopStatusPolling()
          isRegenerating.current = false // Reset flag
          return
        }
        
        // Si la sesión está en error o desconectada, también cerrar (SOLO SI NO ESTÁ REGENERANDO)
        if ((mappedStatus === 'error' || mappedStatus === 'disconnected') && !isRegenerating.current) {
          console.log('[STATUS-POLLING] Sesión en estado de error/desconectada, cerrando modales')
          stopStatusPolling()
          
          toast({
            title: "Error de Conexión",
            description: "La sesión no se pudo autenticar. Verifica tu conexión e intenta nuevamente.",
            variant: "destructive"
          })
          
          setTimeout(() => {
            closeVerificationModal()
            closeQRModal()
          }, 1500)
          
          return
        } else if ((mappedStatus === 'error' || mappedStatus === 'disconnected') && isRegenerating.current) {
          // Durante regeneración, ignorar errores temporales
          console.log('[STATUS-POLLING] Error/desconectado durante regeneración - ignorando')
        }
        
      } catch (error) {
        console.error('[STATUS-POLLING] Error monitoreando estado:', error)
      }
    }
    
    // ✅ FUNCIÓN PARA DETENER POLLING CORRECTAMENTE
    const stopStatusPolling = () => {
      console.log('[STATUS-POLLING] 🛑 Deteniendo polling')
      if (statusPollingInterval.current) {
        clearInterval(statusPollingInterval.current)
        statusPollingInterval.current = null
      }
      isStatusPollingActive.current = false
    }
    
    // Ejecutar inmediatamente
    await checkStatus()
    
    // Configurar polling cada 3 segundos
    const interval = setInterval(checkStatus, 3000)
    statusPollingInterval.current = interval
    
    // Timeout de 90 segundos
    setTimeout(() => {
      console.log('[STATUS-POLLING] Timeout alcanzado (90s), deteniendo polling')
      stopStatusPolling()
      
      const isVerificationModalOpen = verificationData.code && verificationData.code !== 'polling'
      const isQRModalOpen = qrCodeData && qrCodeData.qrCode !== 'polling'
      
      if (isVerificationModalOpen || isQRModalOpen) {
        console.log('[STATUS-POLLING] Cerrando modales por timeout')
        
        toast({
          title: "Tiempo Agotado",
          description: "El proceso de autenticación tomó demasiado tiempo. Intenta crear una nueva sesión.",
          variant: "destructive"
        })
        
        setTimeout(() => {
          closeVerificationModal()
          closeQRModal()
        }, 1000)
      }
    }, 90000)
  }
  
  // Funciones de polling para obtener QR/código después de crear sesión
  const pollForQRCode = async (sessionId: string, sessionName: string, phoneNumber: string, attempts: number = 0) => {
    // ✅ PREVENIR MÚLTIPLE POLLING QR
    if (isQRPollingActive.current) {
      console.log('[QR-POLLING] ⚠️ Ya hay polling QR activo, evitando duplicado')
      return
    }
    
    const maxAttempts = 15
    const pollInterval = 3000
    
    // 🕐 DELAY INICIAL para dar tiempo a la generación del QR
    if (attempts === 0) {
      console.log('[QR-POLLING] ⏱️ Aplicando delay inicial de 3s para generación de QR')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    
    console.log(`[QR-POLLING] Intento ${attempts + 1}/${maxAttempts} para obtener QR de ${sessionId}`)
    
    if (attempts >= maxAttempts) {
      console.log('[QR-POLLING] Máximo de intentos alcanzado')
      isQRPollingActive.current = false
      toast({
        title: "Error",
        description: "No se pudo obtener el código QR. Intenta nuevamente.",
        variant: "destructive"
      })
      closeQRModal()
      return
    }
    
    if (attempts === 0) {
      isQRPollingActive.current = true
    }
    
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/${sessionId}/qr`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log(`[QR-POLLING] Error HTTP ${response.status}: ${errorText}`)
        
        // Si es 404, significa que el QR aún no está listo, seguir intentando
        if (response.status === 404 && attempts < maxAttempts - 1) {
          console.log('[QR-POLLING] QR aún no listo (404), reintentando...')
          setTimeout(() => pollForQRCode(sessionId, sessionName, phoneNumber, attempts + 1), pollInterval)
          return
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('[QR-POLLING] Respuesta del backend:', data)
      
      // Buscar el QR en diferentes ubicaciones posibles
      const possibleQRLocations = [
        data.data?.qrcode,
        data.data?.qr,
        data.data?.baileysResponse?.data?.qrcode,
        data.data?.baileysResponse?.qrcode,
        data.qrcode,
        data.qr,
        data.baileysResponse?.data?.qrcode,
        data.baileysResponse?.qrcode
      ]
      
      const qrCode = possibleQRLocations.find(q => q && typeof q === 'string' && q !== 'polling')
      
      if (qrCode) {
        console.log('[QR-POLLING] QR encontrado, actualizando modal')
        isQRPollingActive.current = false
        
        setQrCodeData({
          sessionId,
          sessionName,
          qrCode,
          phoneNumber
        })
        
        setQrPollingActive(false)
        
        // Iniciar monitoreo del estado
        console.log('[QR-POLLING] Iniciando monitoreo de estado')
        pollSessionStatus(sessionId)
        
        return
      }
      
      console.log('[QR-POLLING] QR no encontrado, reintentando en', pollInterval, 'ms')
      setTimeout(() => pollForQRCode(sessionId, sessionName, phoneNumber, attempts + 1), pollInterval)
      
    } catch (error) {
      console.error('[QR-POLLING] Error:', error)
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollForQRCode(sessionId, sessionName, phoneNumber, attempts + 1), pollInterval)
      } else {
        isQRPollingActive.current = false
        toast({
          title: "Error",
          description: "No se pudo obtener el código QR. Intenta nuevamente.",
          variant: "destructive"
        })
        closeQRModal()
      }
    }
  }
  
  const pollForPairingCode = async (sessionId: string, sessionName: string, phoneNumber: string, attempts: number = 0) => {
    // ✅ PREVENIR MÚLTIPLE POLLING CODE
    if (isCodePollingActive.current) {
      console.log('[CODE-POLLING] ⚠️ Ya hay polling CODE activo, evitando duplicado')
      return
    }
    
    const maxAttempts = 15
    const pollInterval = 3000
    
    // 🕐 DELAY INICIAL para dar tiempo a la generación del código
    if (attempts === 0) {
      console.log('[CODE-POLLING] ⏱️ Aplicando delay inicial de 3s para generación de código')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
    
    console.log(`[CODE-POLLING] Intento ${attempts + 1}/${maxAttempts} para obtener código de ${sessionId}`)
    
    if (attempts >= maxAttempts) {
      console.log('[CODE-POLLING] Máximo de intentos alcanzado')
      isCodePollingActive.current = false
      toast({
        title: "Error",
        description: "No se pudo obtener el código de emparejamiento. Intenta nuevamente.",
        variant: "destructive"
      })
      closeVerificationModal()
      return
    }
    
    if (attempts === 0) {
      isCodePollingActive.current = true
    }
    
    try {
      const token = localStorage.getItem('token')
      const pairingEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/${sessionId}/qr`
      
      console.log(`[CODE-POLLING] 🎯 Endpoint: ${pairingEndpoint}`)
      
      const response = await fetch(pairingEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log(`[CODE-POLLING] Error HTTP ${response.status}: ${errorText}`)
        
        // Si es 404, el código aún no está listo
        if (response.status === 404 && attempts < maxAttempts - 1) {
          console.log('[CODE-POLLING] Código aún no listo (404), reintentando...')
          setTimeout(() => pollForPairingCode(sessionId, sessionName, phoneNumber, attempts + 1), pollInterval)
          return
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('[CODE-POLLING] ✅ Respuesta del endpoint /qr:', data)
      
      // Buscar código en ubicaciones principales
      const possibleCodeLocations = [
        data.data?.code,
        data.data?.pairingCode,
        data.code,
        data.pairingCode,
        data.data?.pairCode,
        data.data?.verificationCode,
        data.pairCode,
        data.verificationCode,
        data.data?.baileysResponse?.data?.code,
        data.data?.baileysResponse?.data?.pairingCode,
        data.data?.baileysResponse?.code,
        data.data?.baileysResponse?.pairingCode,
        data.baileysResponse?.data?.code,
        data.baileysResponse?.data?.pairingCode,
        data.baileysResponse?.code,
        data.baileysResponse?.pairingCode
      ]
      
      const code = possibleCodeLocations.find(c => c && typeof c === 'string' && c !== 'polling')
      
      if (code) {
        console.log('[CODE-POLLING] ✅ Código encontrado:', code)
        isCodePollingActive.current = false
        
        setVerificationData({
          code,
          sessionId,
          sessionName,
          phoneNumber,
          expiryTime: Date.now() + 30000,
          timeRemaining: 30,
          copied: false,
          requesting: false
        })
        
        // Iniciar temporizador
        startVerificationTimer()
        
        // Iniciar monitoreo del estado
        console.log('[CODE-POLLING] Iniciando monitoreo de estado')
        pollSessionStatus(sessionId)
        
        return
      }
      
      console.log('[CODE-POLLING] Código no encontrado, reintentando en', pollInterval, 'ms')
      setTimeout(() => pollForPairingCode(sessionId, sessionName, phoneNumber, attempts + 1), pollInterval)
      
    } catch (error) {
      console.error('[CODE-POLLING] Error:', error)
      
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollForPairingCode(sessionId, sessionName, phoneNumber, attempts + 1), pollInterval)
      } else {
        isCodePollingActive.current = false
        toast({
          title: "Error",
          description: "No se pudo obtener el código de emparejamiento. Verifica que el backend esté funcionando.",
          variant: "destructive"
        })
        closeVerificationModal()
      }
    }
  }
  
  // Eliminar sesión
  const deleteSession = async (sessionId: string) => {
    try {
      const response = await sessionsAPI.delete(sessionId)
      if (response.success) {
        toast({
          title: "Éxito",
          description: `Sesión "${sessionId}" eliminada exitosamente`
        })
        loadSessions()
      } else {
        throw new Error(response.message || 'Error eliminando sesión')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la sesión",
        variant: "destructive"
      })
    }
  }
  
  // Eliminar sesiones no activas
  const deleteInactiveSessions = async () => {
    const inactiveSessions = sessions.filter(s => s.status === 'disconnected' || s.status === 'error')
    
    if (inactiveSessions.length === 0) {
      toast({
        title: "Información",
        description: "No hay sesiones inactivas para eliminar"
      })
      return
    }
    
    setBulkDeleting(true)
    try {
      const deletePromises = inactiveSessions.map(session => sessionsAPI.delete(session.id))
      const results = await Promise.all(deletePromises)
      
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        toast({
          title: "Éxito",
          description: `${successCount} sesiones inactivas eliminadas exitosamente` + 
                      (errorCount > 0 ? ` (${errorCount} fallaron)` : '')
        })
      }
      
      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Error",
          description: "No se pudieron eliminar las sesiones inactivas",
          variant: "destructive"
        })
      }
      
      loadSessions()
    } catch (error) {
      console.error('Error deleting inactive sessions:', error)
      toast({
        title: "Error",
        description: "Error al eliminar sesiones inactivas",
        variant: "destructive"
      })
    } finally {
      setBulkDeleting(false)
      setShowInactiveConfirmation(false)
    }
  }
  
  // Mostrar confirmación para eliminar sesiones inactivas
  const handleDeleteInactiveSessions = () => {
    const inactiveSessions = sessions.filter(s => s.status === 'disconnected' || s.status === 'error')
    
    if (inactiveSessions.length === 0) {
      toast({
        title: "Información",
        description: "No hay sesiones inactivas para eliminar"
      })
      return
    }
    
    setShowInactiveConfirmation(true)
  }
  
  // Eliminar sesiones autenticadas
  const deleteAuthenticatedSessions = async () => {
    const authenticatedSessions = sessions.filter(s => s.authenticated)
    
    if (authenticatedSessions.length === 0) {
      toast({
        title: "Información",
        description: "No hay sesiones autenticadas para eliminar"
      })
      return
    }
    
    setBulkDeleting(true)
    try {
      const deletePromises = authenticatedSessions.map(session => sessionsAPI.delete(session.id))
      const results = await Promise.all(deletePromises)
      
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      
      if (successCount > 0) {
        toast({
          title: "Éxito",
          description: `${successCount} sesiones autenticadas eliminadas exitosamente` + 
                      (errorCount > 0 ? ` (${errorCount} fallaron)` : '')
        })
      }
      
      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Error",
          description: "No se pudieron eliminar las sesiones autenticadas",
          variant: "destructive"
        })
      }
      
      loadSessions()
    } catch (error) {
      console.error('Error deleting authenticated sessions:', error)
      toast({
        title: "Error",
        description: "Error al eliminar sesiones autenticadas",
        variant: "destructive"
      })
    } finally {
      setBulkDeleting(false)
      setShowAuthenticatedConfirmation(false)
    }
  }
  
  // Mostrar confirmación para eliminar sesiones autenticadas
  const handleDeleteAuthenticatedSessions = () => {
    const authenticatedSessions = sessions.filter(s => s.authenticated)
    
    if (authenticatedSessions.length === 0) {
      toast({
        title: "Información",
        description: "No hay sesiones autenticadas para eliminar"
      })
      return
    }
    
    setShowAuthenticatedConfirmation(true)
  }
  
  // Refrescar sesión
  const refreshSession = async (sessionId: string) => {
    setRefreshing(sessionId)
    try {
      const response = await sessionsAPI.status(sessionId)
      if (response.success) {
        loadSessions()
        toast({
          title: "Actualizado",
          description: "Estado de la sesión actualizado"
        })
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      })
    } finally {
      setRefreshing(null)
    }
  }
  
  // Funciones utilitarias
  const resetFormData = () => {
    setFormData({
      sessionName: '',
      authType: 'qr',
      phoneNumber: '',
      webhookUrl: ''
    })
  }
  
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }
  
  const toggleSelectAll = () => {
    if (selectAllMode) {
      setSelectedSessions([])
    } else {
      setSelectedSessions(sessions.map(s => s.id))
    }
    setSelectAllMode(!selectAllMode)
  }
  
  const closeVerificationModal = () => {
    console.log('[CLOSE-MODAL] Cerrando modal de verificación')
    
    // ✅ CLEANUP COMPLETO CON useRef
    if (statusPollingInterval.current) {
      console.log('[CLOSE-MODAL] Limpiando interval de status polling')
      clearInterval(statusPollingInterval.current)
      statusPollingInterval.current = null
    }
    
    if (verificationTimer.current) {
      console.log('[CLOSE-MODAL] Limpiando verification timer')
      clearInterval(verificationTimer.current)
      verificationTimer.current = null
    }
    
    // Reset flags
    isStatusPollingActive.current = false
    isCodePollingActive.current = false
    isRegenerating.current = false
    
    setVerificationData({
      code: null,
      sessionId: null,
      sessionName: null,
      phoneNumber: null,
      expiryTime: null,
      timeRemaining: 30,
      copied: false,
      requesting: false
    })
    
    setModalSessionStatus('connecting')
    setModalSessionAuthenticated(false)
  }
  
  const closeQRModal = () => {
    console.log('[CLOSE-MODAL] Cerrando modal de QR')
    
    // ✅ CLEANUP COMPLETO CON useRef
    if (statusPollingInterval.current) {
      console.log('[CLOSE-MODAL] Limpiando interval de status polling')
      clearInterval(statusPollingInterval.current)
      statusPollingInterval.current = null
    }
    
    // Reset flags
    isStatusPollingActive.current = false
    isQRPollingActive.current = false
    isRegenerating.current = false
    
    setQrCodeData(null)
    setQrPollingActive(false)
    
    setModalSessionStatus('connecting')
    setModalSessionAuthenticated(false)
  }
  
  // Efecto para cargar sesiones inicialmente
  useEffect(() => {
    loadSessions()
    const interval = setInterval(() => loadSessions(), 45000)
    return () => clearInterval(interval)
  }, [])
  
  // ✅ CLEANUP MEJORADO al desmontar componente
  useEffect(() => {
    return () => {
      // Limpiar todos los timers
      if (statusPollingInterval.current) {
        clearInterval(statusPollingInterval.current)
        statusPollingInterval.current = null
      }
      if (verificationTimer.current) {
        clearInterval(verificationTimer.current)
        verificationTimer.current = null
      }
      
      // Reset flags
      isStatusPollingActive.current = false
      isQRPollingActive.current = false
      isCodePollingActive.current = false
      isRegenerating.current = false
    }
  }, [])
  
  return {
    // Estados
    sessions,
    loading,
    creating,
    refreshing,
    showCreateForm,
    formData,
    selectedSessions,
    selectAllMode,
    bulkDeleting,
    verificationData,
    qrCodeData,
    qrPollingActive,
    modalSessionStatus,
    modalSessionAuthenticated,
    showInactiveConfirmation,
    showAuthenticatedConfirmation,
    
    // Acciones
    setShowCreateForm,
    setFormData,
    loadSessions,
    createSession,
    deleteSession,
    deleteInactiveSessions,
    deleteAuthenticatedSessions,
    handleDeleteInactiveSessions,
    handleDeleteAuthenticatedSessions,
    refreshSession,
    toggleSessionSelection,
    toggleSelectAll,
    closeVerificationModal,
    closeQRModal,
    setShowInactiveConfirmation,
    setShowAuthenticatedConfirmation,
    
    // Funciones utilitarias
    resetFormData,
    
    // Funciones de regeneración
    regenerateVerificationCode,
    regenerateQRCode
  }
}
