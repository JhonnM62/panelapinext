import React, { memo, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Bot, 
  Webhook, 
  AlertTriangle, 
  CheckCircle, 
  Crown, 
  TrendingUp,
  Zap
} from 'lucide-react'
import { ResourceLimits, Suscripcion } from '@/types/plans'
import { useRouter } from 'next/navigation'

interface LimitsCardProps {
  suscripcion: Suscripcion
  resourceLimits: ResourceLimits
  showActions?: boolean
  title?: string
  className?: string
}

export const LimitsCard: React.FC<LimitsCardProps> = memo(({
  suscripcion,
  resourceLimits,
  showActions = true,
  title = "Límites del Plan",
  className = ""
}) => {
  const router = useRouter()

  // 🚀 Memorizar funciones para evitar re-renders
  const getProgressColor = useMemo(() => (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }, [])

  const getUsageColor = useMemo(() => (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }, [])

  const getStatusIcon = useMemo(() => (percentage: number) => {
    if (percentage >= 100) return <AlertTriangle className="h-4 w-4 text-red-600" />
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }, [])

  // 🚀 Memorizar recursos para evitar recalcular
  const resources = useMemo(() => [
    {
      key: 'sesiones' as const,
      label: 'Sesiones WhatsApp',
      icon: Users,
      color: 'text-blue-600',
      data: resourceLimits.sesiones
    },
    {
      key: 'botsIA' as const,
      label: 'ChatBots con IA',
      icon: Bot,
      color: 'text-purple-600',
      data: resourceLimits.botsIA
    },
    {
      key: 'webhooks' as const,
      label: 'Webhooks',
      icon: Webhook,
      color: 'text-green-600',
      data: resourceLimits.webhooks
    }
  ], [resourceLimits])

  // 🚀 Memorizar indicadores de alerta
  const hasWarnings = useMemo(() => 
    resources.some(r => r.data.percentage >= 90),
    [resources]
  )

  const hasNearLimits = useMemo(() => 
    resources.some(r => r.data.percentage >= 70),
    [resources]
  )

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                Plan {suscripcion.plan.nombre}
                <Badge variant={suscripcion.estaActiva ? 'default' : 'destructive'}>
                  {suscripcion.estado}
                </Badge>
              </CardDescription>
            </div>
          </div>
          {suscripcion.diasRestantes <= 7 && suscripcion.estaActiva && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {suscripcion.diasRestantes} días restantes
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Resumen de recursos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {resources.map(({ key, label, icon: Icon, color, data }) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(data.percentage)}
                  <Badge variant="outline" className="text-xs">
                    {data.current}/{data.limit}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={data.percentage} 
                  className="h-2"
                  // @ts-ignore - custom color
                  style={{
                    '--progress-background': getProgressColor(data.percentage)
                  }}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={getUsageColor(data.percentage)}>
                    {data.remaining} disponibles
                  </span>
                  <span className="text-muted-foreground">
                    {data.percentage}% usado
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estado general */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Duración del plan</p>
              <p className="font-medium">{suscripcion.plan.duracion} días</p>
            </div>
            <div>
              <p className="text-muted-foreground">Días restantes</p>
              <p className="font-medium">{suscripcion.diasRestantes}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mensajes enviados</p>
              <p className="font-medium">{suscripcion.usoActual.mensajesEnviados.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Última actualización</p>
              <p className="font-medium">
                {new Date(suscripcion.usoActual.ultimaActualizacionUso).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>

        {/* Advertencias y acciones */}
        {!suscripcion.estaActiva && (
          <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 dark:text-red-100">
                  Suscripción {suscripcion.estado}
                </h4>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  No puedes crear nuevos recursos hasta renovar tu plan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ⚠️ Mostrar advertencias de límites */}
        {suscripcion.estaActiva && hasWarnings && (
          <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                  ⚠️ Cerca del límite
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Has usado más del 90% de algunos recursos. Considera actualizar tu plan para evitar interrupciones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => router.push('/dashboard/upgrade')}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Actualizar Plan
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/settings/advanced')}
              className="flex-1"
            >
              <Crown className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// 🏷️ Nombre para debugging en React DevTools
LimitsCard.displayName = 'LimitsCard'

export default LimitsCard
