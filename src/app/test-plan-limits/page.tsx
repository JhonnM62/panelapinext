/**
 * PÁGINA DE TEST TEMPORAL PARA VERIFICAR LAS CORRECCIONES
 * 
 * Accede a /test-plan-limits para verificar que el hook funcione
 */

'use client'

import TestPlanLimits from '@/components/test/TestPlanLimits'

export default function TestPlanLimitsPage() {
  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Test del Hook usePlanLimits</h1>
        <p className="text-gray-600">Verificación de las correcciones implementadas</p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <TestPlanLimits />
      </div>
      
      <div className="text-center text-sm text-gray-500">
        <p>Revisa la consola del navegador para logs detallados</p>
        <p>Este archivo es temporal y se puede eliminar después de las pruebas</p>
      </div>
    </div>
  )
}
