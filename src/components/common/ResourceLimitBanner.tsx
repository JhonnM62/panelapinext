import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Crown } from 'lucide-react'
import Link from 'next/link'

interface ResourceLimitBannerProps {
  suscripcion: any
  resourceLimits: any
  resourceType: string
  resourceDisplayName: string
}

export const ResourceLimitBanner: React.FC<ResourceLimitBannerProps> = ({
  suscripcion,
  resourceLimits,
  resourceType,
  resourceDisplayName
}) => {
  const resource = resourceLimits[resourceType]
  if (!resource || resource.percentage < 80) return null

  const isAtLimit = resource.percentage >= 100
  const isNearLimit = resource.percentage >= 90

  return (
    <Card className={`${
      isAtLimit 
        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${
              isAtLimit ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div>
              <h3 className={`font-medium ${
                isAtLimit ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                {isAtLimit ? `Límite de ${resourceDisplayName} Alcanzado` : `Límite de ${resourceDisplayName} Próximo`}
              </h3>
              <p className={`text-sm ${
                isAtLimit ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                Usando {resource.current} de {resource.limit} disponibles ({resource.percentage}%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isAtLimit ? 'destructive' : 'outline'}>
              {resource.current}/{resource.limit}
            </Badge>
            <Link href="/dashboard/upgrade">
              <Button size="sm" variant={isAtLimit ? 'default' : 'outline'}>
                <Crown className="h-4 w-4 mr-1" />
                Actualizar Plan
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ResourceLimitBanner