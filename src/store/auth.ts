import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, LoginRequest, RegisterRequest } from '@/types'
import { authAPI } from '@/lib/api'
import { jwtDecode } from 'jwt-decode'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: (reason?: 'manual' | 'inactivity' | 'hard_refresh' | 'expired') => void
  checkAuth: () => void
  clearError: () => void
  renewMembership: (tipoplan: string) => Promise<void>
  refreshUserInfo: () => Promise<void>
  initializeAuth: () => void
}

// Función helper para calcular días restantes
const getDaysRemaining = (fechaFin: string): number => {
  if (!fechaFin) return 0
  const endDate = new Date(fechaFin)
  const now = new Date()
  const diffTime = endDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        // RATE LIMITING: Verificar último intento
        const lastAttempt = localStorage.getItem('last_login_attempt')
        const retryAfter = localStorage.getItem('login_retry_after')
        
        if (lastAttempt && retryAfter) {
          const lastAttemptTime = parseInt(lastAttempt)
          const retryAfterTime = parseInt(retryAfter)
          const now = Date.now()
          
          if (now < retryAfterTime) {
            const waitTime = Math.ceil((retryAfterTime - now) / 1000 / 60)
            throw new Error(`Rate limit activo. Espera ${waitTime} minuto(s) antes de intentar nuevamente.`)
          }
        }
        
        try {
          set({ isLoading: true, error: null })
          
          // Registrar intento de login
          localStorage.setItem('last_login_attempt', Date.now().toString())
          
          console.log('🔧 [Auth] Iniciando login con V2...')
          const response = await authAPI.login(credentials)
          
          if (!response.data?.success || !response.data?.data) {
            throw new Error(response.data?.message || 'Respuesta inválida del servidor')
          }
          
          const userData = response.data.data
          console.log('🔧 [Auth] Datos del usuario recibidos:', {
            id: userData.id,
            email: userData.email,
            tipoplan: userData.tipoplan,
            fechaFin: userData.fechaFin
          })
          
          if (!userData.token) {
            throw new Error('No se recibió token del servidor')
          }
          
          // Guardar token en localStorage y cookies inmediatamente
          localStorage.setItem('token', userData.token)
          
          // Guardar token en cookies para que el middleware pueda acceder
          document.cookie = `token=${userData.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
          
          // Calcular si la membresía está expirada
          const daysRemaining = getDaysRemaining(userData.fechaFin)
          const membershipExpired = daysRemaining <= 0
          
          // Crear objeto de usuario con la nueva estructura
          const user: User = {
            // IDs
            id: userData.id,
            _id: userData.id,
            
            // Datos básicos
            email: userData.email,
            rol: userData.rol,
            tipoplan: userData.tipoplan,
            
            // Membresía
            numerodesesiones: userData.numerodesesiones,
            duracionMembresiaDias: userData.duracionMembresiaDias,
            fechaInicio: userData.fechaInicio,
            fechaFin: userData.fechaFin,
            ultimoAcceso: userData.ultimoAcceso,
            
            // Estado
            token: userData.token,
            activo: userData.activo !== false,
            membershipExpired,
            
            // Configuración y estadísticas
            configuracion: userData.configuracion || {},
            estadisticas: userData.estadisticas || {},
            
            // Compatibilidad legacy
            nombrebot: userData.email, // Usar email como fallback
            role: userData.rol === 'admin' ? 'admin' : 'user',
            maxSessions: userData.numerodesesiones || 1,
            isActive: userData.activo !== false
          }
          
          console.log('🔧 [Auth] Usuario creado exitosamente:', {
            ...user,
            token: user.token.substring(0, 20) + '...'
          })
          
          // LIMPIAR datos de rate limiting si login exitoso
          localStorage.removeItem('last_login_attempt')
          localStorage.removeItem('login_retry_after')
          
          console.log('🔧 [Auth] Actualizando estado del store...')
          set({ user, token: userData.token, isLoading: false })
          console.log('🔧 [Auth] Login completado exitosamente')
        } catch (error: any) {
          console.error('🔧 [Auth] Error en login:', error)
          
          // MANEJO ESPECÍFICO DE RATE LIMITING (429)
          if (error.response?.status === 429) {
            const errorData = error.response.data
            const retryAfterText = errorData?.retryAfter || '15 minutos'
            
            // Calcular tiempo de espera en ms
            let retryAfterMs = 15 * 60 * 1000 // default 15 minutos
            if (retryAfterText.includes('minuto')) {
              const minutes = parseInt(retryAfterText.match(/\d+/)?.[0] || '15')
              retryAfterMs = minutes * 60 * 1000
            } else if (retryAfterText.includes('segundo')) {
              const seconds = parseInt(retryAfterText.match(/\d+/)?.[0] || '900')
              retryAfterMs = seconds * 1000
            }
            
            // Guardar tiempo de retry
            const retryAfterTime = Date.now() + retryAfterMs
            localStorage.setItem('login_retry_after', retryAfterTime.toString())
            
            const waitMinutes = Math.ceil(retryAfterMs / 1000 / 60)
            const errorMessage = `Demasiadas peticiones. Intenta nuevamente en ${waitMinutes} minuto(s).`
            
            set({ 
              error: errorMessage,
              isLoading: false 
            })
            throw new Error(errorMessage)
          }
          
          // Otros errores
          console.error('🔧 [Auth] Error detallado:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            stack: error.stack
          })
          
          const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión'
          
          set({ 
            error: errorMessage,
            isLoading: false 
          })
          throw new Error(errorMessage)
        }
      },

      register: async (data: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null })
          
          console.log('🔧 [Auth] Iniciando registro con V2...')
          const response = await authAPI.register(data)
          
          if (!response.data?.success || !response.data?.data) {
            throw new Error(response.data?.message || 'Respuesta inválida del servidor')
          }
          
          const userData = response.data.data
          
          if (!userData.token) {
            throw new Error('No se recibió token del servidor')
          }
          
          // Guardar token en localStorage inmediatamente
          localStorage.setItem('token', userData.token)
          
          // Calcular si la membresía está expirada
          const daysRemaining = getDaysRemaining(userData.fechaFin)
          const membershipExpired = daysRemaining <= 0
          
          // Crear objeto de usuario con la nueva estructura
          const user: User = {
            // IDs
            id: userData.id,
            _id: userData.id,
            
            // Datos básicos
            email: userData.email,
            rol: userData.rol,
            tipoplan: userData.tipoplan,
            
            // Membresía
            numerodesesiones: userData.numerodesesiones,
            duracionMembresiaDias: userData.duracionMembresiaDias,
            fechaInicio: userData.fechaInicio,
            fechaFin: userData.fechaFin,
            ultimoAcceso: userData.ultimoAcceso,
            
            // Estado
            token: userData.token,
            activo: userData.activo !== false,
            membershipExpired,
            
            // Configuración y estadísticas
            configuracion: userData.configuracion || {},
            estadisticas: userData.estadisticas || {},
            
            // Compatibilidad legacy
            nombrebot: userData.email, // Usar email como fallback
            role: userData.rol === 'admin' ? 'admin' : 'user',
            maxSessions: userData.numerodesesiones || 1,
            isActive: userData.activo !== false
          }
          
          set({ user, token: userData.token, isLoading: false })
        } catch (error: any) {
          console.error('🔧 [Auth] Error en registro:', error)
          set({ 
            error: error.message || 'Error al registrarse',
            isLoading: false 
          })
          throw error
        }
      },

      logout: (reason?: 'manual' | 'inactivity' | 'hard_refresh' | 'expired') => {
        const logoutReason = reason || 'manual'
        console.log(`🔧 [Auth] Logout iniciado - Razón: ${logoutReason}`)
        
        // Limpiar completamente el localStorage de datos de autenticación
        localStorage.removeItem('token')
        localStorage.removeItem('baileys_token')
        localStorage.removeItem('auth-storage')
        
        // Limpiar cookies de autenticación
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        document.cookie = 'baileys_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        
        // Limpiar datos de sesión específicos
        localStorage.removeItem('session_last_activity')
        localStorage.removeItem('session_id')
        
        // Limpiar cualquier otro dato relacionado con sesiones
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('session_') || key.startsWith('whatsapp_') || key.startsWith('baileys_')) {
            localStorage.removeItem(key)
          }
        })
        
        // Limpiar sessionStorage para forzar recarga completa
        if (reason === 'hard_refresh') {
          sessionStorage.clear()
        }
        
        set({ user: null, token: null, error: null })
        console.log(`🔧 [Auth] Logout completado - Razón: ${logoutReason}`)
      },

      checkAuth: () => {
        const { token, user, isLoading } = get()
        if (!token) {
          if (isLoading) {
            set({ isLoading: false })
          }
          return
        }

        try {
          const decoded: any = jwtDecode(token)
          const now = Date.now() / 1000
          
          if (decoded.exp < now) {
            // Token expirado - marcar como expirado pero no logout
            if (!user?.membershipExpired) {
              console.log('[AUTH] Token expirado - marcando membresía como expirada')
              set((state) => ({
                user: state.user ? {
                  ...state.user,
                  membershipExpired: true
                } : null,
                isLoading: false
              }))
            } else if (isLoading) {
              set({ isLoading: false })
            }
            return
          }
          
          // Token válido - solo actualizar si hay cambios necesarios
          const needsUpdate = user?.membershipExpired === true || isLoading === true
          if (needsUpdate) {
            console.log('[AUTH] Token válido - actualizando estado')
            set((state) => ({
              user: state.user ? {
                ...state.user,
                membershipExpired: false
              } : null,
              isLoading: false
            }))
          }
        } catch (error) {
          console.error('[AUTH] Error decodificando token:', error)
          get().logout()
          set({ isLoading: false })
        }
      },

      clearError: () => set({ error: null }),

      renewMembership: async (tipoplan: string) => {
        try {
          const { token } = get()
          if (!token) {
            throw new Error('No hay token disponible')
          }
          
          set({ isLoading: true, error: null })
          
          console.log('🔧 [Auth] Renovando membresía con plan:', tipoplan)
          const response = await authAPI.renewMembership({
            token,
            tipoplan: tipoplan as any
          })
          
          if (!response.data?.success || !response.data?.data) {
            throw new Error(response.data?.message || 'Error en renovación')
          }
          
          const userData = response.data.data
          
          // Actualizar localStorage y cookies con el nuevo token
          localStorage.setItem('token', userData.token)
          document.cookie = `token=${userData.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
          
          // Calcular días restantes
          const daysRemaining = getDaysRemaining(userData.fechaFin)
          const membershipExpired = daysRemaining <= 0
          
          // Actualizar usuario con nueva información
          const currentState = get()
          const updatedUser: User = {
            ...currentState.user!,
            tipoplan: userData.tipoplan,
            duracionMembresiaDias: userData.duracionMembresiaDias,
            fechaFin: userData.fechaFin,
            token: userData.token,
            membershipExpired,
            estadisticas: userData.estadisticas || currentState.user?.estadisticas
          }
          
          set({
            token: userData.token,
            user: updatedUser,
            isLoading: false,
            error: null
          })
          
          console.log('🔧 [Auth] Membresía renovada exitosamente')
        } catch (error: any) {
          console.error('🔧 [Auth] Error renovando membresía:', error)
          set({ 
            error: error.message || 'Error al renovar membresía',
            isLoading: false 
          })
          throw error
        }
      },

      refreshUserInfo: async () => {
        try {
          const { token, user } = get()
          if (!token || !user) {
            console.warn('🔧 [Auth] No hay sesión activa para refrescar')
            return
          }

          console.log('🔧 [Auth] Refrescando información del usuario...')
          
          try {
            // Usar el nuevo endpoint para obtener datos completos
            const response = await authAPI.getDashboardData(token)
            
            if (response.success && response.data) {
              const dashboardData = response.data
              
              // Actualizar el usuario con los datos más recientes
              const updatedUser: User = {
                ...user,
                
                // Datos del usuario
                id: dashboardData.usuario.id,
                _id: dashboardData.usuario.id,
                email: dashboardData.usuario.email,
                nombrebot: dashboardData.usuario.nombrebot || dashboardData.usuario.email,
                rol: dashboardData.usuario.rol,
                activo: dashboardData.usuario.activo,
                ultimoAcceso: dashboardData.usuario.ultimoAcceso,
                
                // Datos del plan
                tipoplan: dashboardData.plan.tipo,
                fechaInicio: dashboardData.plan.fechaInicio,
                fechaFin: dashboardData.plan.fechaFin,
                membershipExpired: dashboardData.plan.membershipExpired,
                
                // Límites
                numerodesesiones: dashboardData.limites.sesiones.maximo,
                maxSessions: dashboardData.limites.sesiones.maximo,
                
                // Estadísticas actualizadas
                estadisticas: dashboardData.estadisticas,
                
                // Mantener token actual
                token: token
              }
              
              set({ user: updatedUser })
              console.log('🔧 [Auth] ✅ Usuario actualizado con datos del dashboard')
              
            } else {
              // Fallback: verificar token con el endpoint simple
              const decoded: any = jwtDecode(token)
              const now = Date.now() / 1000
              
              if (decoded.exp < now) {
                console.log('🔧 [Auth] Token expirado detectado durante refresh')
                set((state) => ({
                  user: state.user ? {
                    ...state.user,
                    membershipExpired: true
                  } : null
                }))
              } else {
                console.log('🔧 [Auth] Token válido, información del usuario mantenida')
                set((state) => ({
                  user: state.user ? {
                    ...state.user,
                    membershipExpired: false
                  } : null
                }))
              }
            }
            
          } catch (jwtError) {
            console.error('🔧 [Auth] Error obteniendo datos del dashboard:', jwtError)
            
            // Fallback: verificar token localmente
            try {
              const decoded: any = jwtDecode(token)
              const now = Date.now() / 1000
              
              if (decoded.exp < now) {
                console.log('🔧 [Auth] Token expirado detectado (fallback)')
                set((state) => ({
                  user: state.user ? {
                    ...state.user,
                    membershipExpired: true
                  } : null
                }))
              }
            } catch (fallbackError) {
              console.error('🔧 [Auth] Error en fallback:', fallbackError)
            }
          }
          
          console.log('🔧 [Auth] ✅ Refresh completado')
          
        } catch (error: any) {
          console.error('🔧 [Auth] Error refrescando información:', error)
        }
      },

      initializeAuth: () => {
        const { token } = get()
        
        // Si no hay token en el estado, intentar obtenerlo desde cookies
        if (!token) {
          const getCookieValue = (name: string): string | null => {
            const value = `; ${document.cookie}`
            const parts = value.split(`; ${name}=`)
            if (parts.length === 2) {
              return parts.pop()?.split(';').shift() || null
            }
            return null
          }
          
          const cookieToken = getCookieValue('token')
          if (cookieToken) {
            console.log('🔧 [Auth] Token encontrado en cookies, inicializando...')
            set({ token: cookieToken })
            
            // También guardarlo en localStorage para consistencia
            localStorage.setItem('token', cookieToken)
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token 
      }),
    }
  )
)
