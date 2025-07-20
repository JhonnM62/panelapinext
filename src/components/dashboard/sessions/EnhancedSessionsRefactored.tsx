'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plus, MessageSquare, Trash2, Wifi, CheckCircle, Users, Activity, Smartphone } from '@/components/ui/icons'
import { useSessionManagement } from './hooks/useSessionManagement'
import { SessionCard } from './SessionCard'
import { CreateSessionModal } from './CreateSessionModal'
import { VerificationCodeModal } from './VerificationCodeModal'
import { QRCodeModal } from './QRCodeModal'
import { ConfirmationModal } from './ConfirmationModal'
import { getAuthenticatedSessions } from './sessionUtils'
import { MetricCard } from '@/components/dashboard/analytics-charts'
import { useState, useEffect } from 'react'
import { analyticsAPI } from '@/lib/api'

export default function EnhancedSessionsComponent() {
  const [todayMessages, setTodayMessages] = useState(0)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  
  const {
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
    resetFormData,
    regenerateVerificationCode,
    regenerateQRCode
  } = useSessionManagement()

  // 🎯 DETECCIÓN AUTOMÁTICA DE PARÁMETRO create=true
  useEffect(() => {
    const checkCreateParam = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const createParam = urlParams.get('create')
      
      console.log('🔍 [Sessions] URL actual:', window.location.href);
      console.log('🔍 [Sessions] Parámetro create:', createParam);
      console.log('🔍 [Sessions] showCreateForm actual:', showCreateForm);
      
      if (createParam === 'true' && !showCreateForm) {
        console.log('✅ [Sessions] ABRIENDO FORMULARIO AUTOMÁTICAMENTE');
        setShowCreateForm(true)
        
        // Limpiar URL después de procesar
        urlParams.delete('create')
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
        window.history.replaceState({}, '', newUrl)
        console.log('🔧 [Sessions] URL limpia:', newUrl);
      }
    }
    
    // Verificar inmediatamente
    checkCreateParam()
    
    // Timer adicional para asegurar
    const timer = setTimeout(checkCreateParam, 200)
    return () => clearTimeout(timer)
  }, [showCreateForm, setShowCreateForm])

  // Cargar datos de analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoadingAnalytics(true)
      try {
        const response = await analyticsAPI.getDashboard()
        if (response.success && response.data?.messages?.today) {
          setTodayMessages(response.data.messages.today)
        }
      } catch (error) {
        console.error('Error cargando analytics:', error)
      } finally {
        setLoadingAnalytics(false)
      }
    }
    
    loadAnalytics()
  }, [])

  const handleFormDataChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const handleCloseCreateForm = () => {
    setShowCreateForm(false)
    resetFormData()
  }

  const handleCopyCode = async () => {
    if (!verificationData.code) return
    
    try {
      await navigator.clipboard.writeText(verificationData.code)
      setFormData(prev => ({ ...prev, copied: true }))
      setTimeout(() => setFormData(prev => ({ ...prev, copied: false })), 2000)
    } catch (error) {
      console.error('Error copying code:', error)
    }
  }

  const authenticatedSessions = getAuthenticatedSessions(sessions)
  const connectedSessions = sessions.filter(s => s.status === 'connected' || s.status === 'authenticated')
  const activeConnections = sessions.filter(s => s.status !== 'disconnected').length
  const inactiveSessions = sessions.filter(s => s.status === 'disconnected' || s.status === 'error')

  // Métricas para el dashboard
  const dashboardStats = {
    totalSessions: sessions.length,
    connectedSessions: connectedSessions.length,
    authenticatedSessions: authenticatedSessions.length,
    totalMessages: todayMessages, // Datos reales del endpoint analytics
    activeConnections
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sesiones de WhatsApp</h2>
          <p className="text-muted-foreground">
            Gestiona tus sesiones de WhatsApp y monitores su estado
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sesión
          </Button>
          <Button
            onClick={() => loadSessions(true)}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas del Dashboard */}
      <div className="space-y-6">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Sesiones"
            value={dashboardStats.totalSessions}
            change={12.3}
            changeLabel="vs semana anterior"
            icon={<Smartphone className="h-8 w-8" />}
            trend="up"
          />
          <MetricCard
            title="Sesiones Conectadas"
            value={dashboardStats.connectedSessions}
            change={5.7}
            changeLabel="vs semana anterior"
            icon={<Wifi className="h-8 w-8" />}
            trend="up"
          />
          <MetricCard
            title="Autenticadas"
            value={dashboardStats.authenticatedSessions}
            change={-2.1}
            changeLabel="vs semana anterior"
            icon={<CheckCircle className="h-8 w-8" />}
            trend="down"
          />
          <MetricCard
            title="Mensajes Hoy"
            value={loadingAnalytics ? '...' : dashboardStats.totalMessages.toLocaleString()}
            change={18.4}
            changeLabel="vs ayer"
            icon={<MessageSquare className="h-8 w-8" />}
            trend="up"
          />
        </div>

        {/* Estadísticas en Tiempo Real */}
        {/* Removido para mejorar la experiencia de usuario - menos scroll */}
      </div>

      {/* Controles de gestión de sesiones */}
      {sessions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {sessions.length} sesiones
            </Badge>
            <Badge variant="default" className="text-sm bg-green-100 text-green-800">
              {authenticatedSessions.length} autenticadas
            </Badge>
            {bulkDeleting && (
              <Badge variant="outline" className="text-sm">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Procesando...
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={toggleSelectAll}
              variant="outline"
              size="sm"
            >
              {selectAllMode ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
            </Button>
            
            {selectedSessions.length > 0 && (
              <Button
                onClick={() => {
                  selectedSessions.forEach(sessionId => deleteSession(sessionId))
                }}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Seleccionadas ({selectedSessions.length})
              </Button>
            )}
            
            {/* Botones de eliminación masiva */}
            <Button
              onClick={handleDeleteInactiveSessions}
              variant="outline"
              size="sm"
              disabled={bulkDeleting || inactiveSessions.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Inactivas ({inactiveSessions.length})
            </Button>
            
            <Button
              onClick={handleDeleteAuthenticatedSessions}
              variant="outline"
              size="sm"
              disabled={bulkDeleting || authenticatedSessions.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Autenticadas ({authenticatedSessions.length})
            </Button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando sesiones...</span>
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <MessageSquare className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay sesiones</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crea tu primera sesión de WhatsApp para comenzar
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sesión
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isSelected={selectedSessions.includes(session.id)}
                isRefreshing={refreshing === session.id}
                onSelect={toggleSessionSelection}
                onRefresh={refreshSession}
                onDelete={deleteSession}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <CreateSessionModal
        isOpen={showCreateForm}
        isCreating={creating}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onClose={handleCloseCreateForm}
        onCreate={createSession}
      />

      <VerificationCodeModal
        isOpen={!!verificationData.code}
        verificationData={verificationData}
        modalSessionStatus={modalSessionStatus}
        modalSessionAuthenticated={modalSessionAuthenticated}
        onCopyCode={handleCopyCode}
        onRequestNewCode={regenerateVerificationCode}
        onClose={closeVerificationModal}
      />

      <QRCodeModal
        isOpen={!!qrCodeData}
        qrData={qrCodeData}
        modalSessionStatus={modalSessionStatus}
        modalSessionAuthenticated={modalSessionAuthenticated}
        isPollingActive={qrPollingActive}
        onRegenerateQR={regenerateQRCode}
        onClose={closeQRModal}
      />
      
      {/* Modales de confirmación */}
      <ConfirmationModal
        isOpen={showInactiveConfirmation}
        onClose={() => setShowInactiveConfirmation(false)}
        onConfirm={deleteInactiveSessions}
        title="Eliminar Sesiones Inactivas"
        description={`¿Estás seguro de que deseas eliminar ${inactiveSessions.length} sesiones inactivas? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Sesiones"
        variant="destructive"
        isLoading={bulkDeleting}
      />
      
      <ConfirmationModal
        isOpen={showAuthenticatedConfirmation}
        onClose={() => setShowAuthenticatedConfirmation(false)}
        onConfirm={deleteAuthenticatedSessions}
        title="Eliminar Sesiones Autenticadas"
        description={`¿Estás seguro de que deseas eliminar ${authenticatedSessions.length} sesiones autenticadas? Esta acción desconectará todas las sesiones activas y no se puede deshacer.`}
        confirmText="Eliminar Sesiones"
        variant="destructive"
        isLoading={bulkDeleting}
      />
    </div>
  )
}
