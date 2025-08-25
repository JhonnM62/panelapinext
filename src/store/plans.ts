import { create } from 'zustand'
import { PricingPlan, PaymentRequest, PaymentResponse } from '@/types'
import { api } from '@/lib/api'

interface PlansState {
  plans: PricingPlan[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchPlans: () => Promise<void>
  createPlan: (plan: Omit<PricingPlan, 'id'>) => Promise<void>
  updatePlan: (id: string, plan: Partial<PricingPlan>) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  togglePlanActive: (id: string) => Promise<void>
  processPayment: (paymentRequest: PaymentRequest) => Promise<PaymentResponse>
  clearError: () => void
}

const defaultPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Prueba Gratuita',
    price: 0,
    duration: 1,
    maxSessions: 1,
    features: [
      '1 día de acceso',
      '1 sesión de WhatsApp',
      'Mensajes básicos',
      'Soporte por email'
    ],
    isActive: true
  },
  {
    id: 'monthly',
    name: 'Plan Mensual',
    price: 7,
    duration: 30,
    maxSessions: 1,
    features: [
      '1 sesión de WhatsApp',
      'Mensajes ilimitados',
      'Automatización básica',
      'Soporte 24/7',
      'Analytics básicos'
    ],
    isActive: true
  },
  {
    id: 'semiannual',
    name: 'Plan 6 Meses',
    price: 37.8,
    originalPrice: 42,
    discount: 10,
    duration: 180,
    maxSessions: 1,
    features: [
      '1 sesión de WhatsApp',
      'Mensajes ilimitados',
      'Automatización avanzada',
      'Soporte prioritario 24/7',
      'Analytics completos',
      'Plantillas personalizadas',
      '10% de descuento'
    ],
    popular: true,
    isActive: true
  },
  {
    id: 'annual',
    name: 'Plan Anual',
    price: 67.2,
    originalPrice: 84,
    discount: 20,
    duration: 365,
    maxSessions: 1,
    features: [
      '1 sesión de WhatsApp',
      'Mensajes ilimitados',
      'Automatización completa',
      'Soporte VIP 24/7',
      'Analytics avanzados',
      'Plantillas premium',
      'API personalizada',
      '20% de descuento'
    ],
    isActive: true
  },
  {
    id: 'lifetime',
    name: 'Plan Vitalicio',
    price: 100,
    duration: 36500,
    maxSessions: 15,
    features: [
      'Hasta 15 sesiones de WhatsApp',
      'Mensajes ilimitados',
      'Todas las funciones premium',
      'Soporte VIP de por vida',
      'Analytics profesionales',
      'API completa',
      'Actualizaciones gratuitas',
      'Garantía de 1 año',
      'Acceso vitalicio'
    ],
    isActive: true
  }
]

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: defaultPlans,
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    try {
      set({ isLoading: true, error: null })
      
      // Por ahora usar datos por defecto
      // En producción, hacer llamada a API:
      // const response = await api.get('/api/plans')
      // set({ plans: response.data, isLoading: false })
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      set({ plans: defaultPlans, isLoading: false })
      
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Error al obtener planes',
        isLoading: false 
      })
    }
  },

  createPlan: async (planData) => {
    try {
      set({ isLoading: true, error: null })
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newPlan: PricingPlan = {
        ...planData,
        id: `custom_${Date.now()}`
      }
      
      set((state) => ({
        plans: [...state.plans, newPlan],
        isLoading: false
      }))
      
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Error al crear plan',
        isLoading: false 
      })
      throw error
    }
  },

  updatePlan: async (id, planData) => {
    try {
      set({ isLoading: true, error: null })
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      set((state) => ({
        plans: state.plans.map(plan => 
          plan.id === id ? { ...plan, ...planData } : plan
        ),
        isLoading: false
      }))
      
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Error al actualizar plan',
        isLoading: false 
      })
      throw error
    }
  },

  deletePlan: async (id) => {
    try {
      set({ isLoading: true, error: null })
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      set((state) => ({
        plans: state.plans.filter(plan => plan.id !== id),
        isLoading: false
      }))
      
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Error al eliminar plan',
        isLoading: false 
      })
      throw error
    }
  },

  togglePlanActive: async (id) => {
    try {
      set((state) => ({
        plans: state.plans.map(plan => 
          plan.id === id ? { ...plan, isActive: !plan.isActive } : plan
        )
      }))
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Error al cambiar estado del plan'
      })
      throw error
    }
  },

  processPayment: async (paymentRequest) => {
    try {
      set({ isLoading: true, error: null })
      
      // En producción, hacer llamada a API de pagos
      // const response = await api.post('/api/payments/process', paymentRequest)
      
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockResponse: PaymentResponse = {
        success: true,
        paymentId: `pay_${Date.now()}`,
        token: 'new_jwt_token_here',
        message: 'Pago procesado exitosamente'
      }
      
      set({ isLoading: false })
      return mockResponse
      
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Error al procesar pago',
        isLoading: false 
      })
      throw error
    }
  },

  clearError: () => set({ error: null })
}))
