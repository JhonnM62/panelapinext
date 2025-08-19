/**
 * COMPONENTE DE PRUEBA PARA VERIFICAR EL HOOK usePlanLimits
 * 
 * Coloca este componente temporalmente en una página para verificar que funcione
 */

'use client'

import React from 'react'
import { usePlanLimits } from '@/hooks/usePlanLimits'

const TestPlanLimits = () => {
  const { 
    suscripcion, 
    resourceLimits, 
    loading, 
    error 
  } = usePlanLimits()

  console.log('🔍 TEST usePlanLimits:', {
    suscripcion,
    resourceLimits,
    loading,
    error
  })

  if (loading) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded">
        <h3 className="font-bold text-yellow-800">🔄 Cargando datos del plan...</h3>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded">
        <h3 className="font-bold text-red-800">❌ Error: {error}</h3>
      </div>
    )
  }

  if (!suscripcion) {
    return (
      <div className="p-4 border border-orange-300 bg-orange-50 rounded">
        <h3 className="font-bold text-orange-800">⚠️ No hay suscripción activa</h3>
      </div>
    )
  }

  return (
    <div className="p-4 border border-green-300 bg-green-50 rounded space-y-4">
      <h3 className="font-bold text-green-800">✅ Hook funcionando correctamente!</h3>
      
      <div className="text-sm">
        <h4 className="font-semibold">📋 Información de Suscripción:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Plan: {suscripcion.plan?.nombre}</li>
          <li>Tipo: {suscripcion.plan?.tipo}</li>
          <li>Estado: {suscripcion.estado}</li>
          <li>Días restantes: {suscripcion.diasRestantes}</li>
          <li>Está activa: {suscripcion.estaActiva ? 'Sí' : 'No'}</li>
        </ul>
      </div>

      {suscripcion.plan?.limites && (
        <div className="text-sm">
          <h4 className="font-semibold">🎯 Límites del Plan:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Sesiones: {suscripcion.plan.limites.sesiones}</li>
            <li>Bots IA: {suscripcion.plan.limites.botsIA}</li>
            <li>Webhooks: {suscripcion.plan.limites.webhooks}</li>
          </ul>
        </div>
      )}

      {suscripcion.usoActual && (
        <div className="text-sm">
          <h4 className="font-semibold">📈 Uso Actual:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Sesiones: {suscripcion.usoActual.sesiones}</li>
            <li>Bots IA: {suscripcion.usoActual.botsIA}</li>
            <li>Webhooks: {suscripcion.usoActual.webhooks}</li>
          </ul>
        </div>
      )}

      {resourceLimits && (
        <div className="text-sm">
          <h4 className="font-semibold">⚡ Límites Calculados:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Sesiones: {resourceLimits.sesiones.current}/{resourceLimits.sesiones.limit} ({resourceLimits.sesiones.remaining} disponibles)</li>
            <li>Bots IA: {resourceLimits.botsIA.current}/{resourceLimits.botsIA.limit} ({resourceLimits.botsIA.remaining} disponibles)</li>
            <li>Webhooks: {resourceLimits.webhooks.current}/{resourceLimits.webhooks.limit} ({resourceLimits.webhooks.remaining} disponibles)</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default TestPlanLimits
