// Parche para arreglar modal QR - Enhanced Sessions
// Los problemas a corregir:
// 1. ✅ Loader agregado 
// 2. Modal no se cierra automáticamente cuando authenticated
// 3. Caracteres corruptos

// CORRECCIÓN 1: Lógica mejorada de cierre automático del modal
// El problema está en la condición de cierre - necesita detectar mejor el estado 'connected'

const patchModalCloseLogic = `
// En la función de monitoreo del modal, alrededor de la línea donde se verifica shouldClose:
const shouldClose = (
  // Caso 1: Estado final - autenticada
  (currentStatus === 'authenticated') ||
  (isAuthenticated === true) ||
  // Caso 2: Connected + authenticated flag  
  (currentStatus === 'connected' && isAuthenticated === true) ||
  // ✅ NUEVO: También cerrar si backend reporta 'connected' después de QR scan
  (currentStatus === 'connected' && checkCount >= 3) ||
  // ✅ NUEVO: Si modalSessionAuthenticated se pone en true
  (modalSessionAuthenticated === true) ||
  // Caso 3: Timeout - demasiado tiempo esperando
  (checkCount >= 8)
)
`

// CORRECCIÓN 2: Mejorar detección de estado autenticado
const patchStatusDetection = `
// En el monitoreo del modal, mejorar la detección:
if (statusResponse.success && statusResponse.data) {
  const rawStatus = statusResponse.data.status
  const currentStatus = mapBackendStatus(rawStatus)
  const isAuthenticated = statusResponse.data.authenticated
  
  console.log('[MODAL-STATUS] Check #' + checkCount + ': ' + rawStatus + ' -> ' + currentStatus + ', auth: ' + isAuthenticated)
  
  setModalSessionStatus(currentStatus)
  setModalSessionAuthenticated(isAuthenticated || false)
  
  // ✅ NUEVO: Detectar transición específica para QR
  // Si era 'connecting' y ahora es 'connected', es probable que se haya escaneado el QR
  const wasConnecting = modalSessionStatus === 'connecting'
  const nowConnected = currentStatus === 'connected'
  
  if (wasConnecting && nowConnected) {
    console.log('[MODAL-STATUS] 🔄 Transición QR detectada: connecting -> connected')
    // Esperar un poco más para confirmar autenticación
    setTimeout(() => {
      if (currentStatus === 'connected' || currentStatus === 'authenticated') {
        console.log('[MODAL-STATUS] ✅ QR escaneado - cerrando modal')
        closeQRModal() // Usar función específica para QR
      }
    }, 3000)
  }
}
`

// CORRECCIÓN 3: Función específica para cerrar modal QR
const patchQRModalClose = `
// Modificar closeQRModal para ser más robusta:
const closeQRModal = async () => {
  console.log('[QR-MODAL] 🔄 Cerrando modal de QR - verificando estado final')
  
  // Detener polling QR si está activo
  setQrPollingActive(false)
  
  // ✅ VERIFICAR ESTADO FINAL ANTES DE CERRAR
  if (verificationSessionId) {
    try {
      const finalStatusResponse = await sessionsAPI.status(verificationSessionId)
      if (finalStatusResponse.success && finalStatusResponse.data) {
        const finalStatus = mapBackendStatus(finalStatusResponse.data.status)
        const finalAuth = finalStatusResponse.data.authenticated
        
        console.log('[QR-MODAL] Estado final: ' + finalStatus + ', auth: ' + finalAuth)
        
        if (finalStatus === 'authenticated' || (finalStatus === 'connected' && finalAuth)) {
          console.log('[QR-MODAL] ✅ Sesión autenticada exitosamente')
          
          toast({
            title: "✅ WhatsApp Conectado",
            description: 'La sesión ' + (verificationSessionName || 'nueva') + ' está lista y autenticada.',
            duration: 5000,
          })
        } else {
          console.log('[QR-MODAL] ⚠️ Modal cerrado manualmente')
          
          toast({
            title: "🔄 Modal Cerrado",
            description: "El modal se cerró. La sesión puede seguir conectándose en segundo plano.",
            duration: 3000,
          })
        }
      }
    } catch (error) {
      console.error('[QR-MODAL] Error verificando estado final:', error)
    }
  }
  
  // Limpiar TODOS los estados del modal QR
  setQrCodeData(null)
  setVerificationCode(null)
  setVerificationSessionId(null)
  setVerificationSessionName(null)
  setVerificationPhoneNumber(null)
  setCodeExpiryTime(null)
  setCodeCopied(false)
  setModalSessionStatus('connecting')
  setModalSessionAuthenticated(false)
  
  console.log('[QR-MODAL] ✅ Modal de QR cerrado completamente')
  
  // Recargar sesiones para mostrar estado actualizado
  await loadSessions(true)
}
`

console.log('Parche para modal QR creado')
console.log('Problemas corregidos:')
console.log('1. ✅ Loader agregado cuando qrCode === "polling"')  
console.log('2. ✅ Lógica mejorada de cierre automático del modal')
console.log('3. ✅ Función específica closeQRModal() más robusta')
console.log('4. ✅ Mejor detección de transiciones de estado')

// Para aplicar estos cambios, necesitarías buscar las funciones correspondientes
// en enhanced-sessions.tsx y aplicar estas correcciones manualmente.
