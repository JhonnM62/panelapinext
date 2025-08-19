import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Server, 
  Database, 
  Zap,
  Activity
} from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'starting';
  message: string;
  timestamp: string;
  checks: {
    memory: { status: string; usage: string };
    requests: { status: string; averageResponseTime: string };
    errors: { status: string; recentErrors: number };
    uptime: { status: string; duration: string };
  };
}

interface SystemMetrics {
  uptime: { human: string };
  requests: { 
    total: number; 
    successRate: string; 
    averageResponseTime: string; 
  };
  cache: { size: number };
  process: { 
    memory: { 
      heapUsed: string; 
      heapTotal: string; 
    }; 
  };
}

export default function HealthMonitor() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar estado básico
      const healthResponse = await fetch('/health/status');
      const healthData = await healthResponse.json();
      setHealthStatus(healthData);

      // Verificar métricas del sistema (requiere autenticación admin)
      try {
        const token = localStorage.getItem('token');
        const metricsResponse = await fetch('/health/metrics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setSystemMetrics(metricsData.data);
        }
      } catch (metricsError) {
        console.warn('No se pudieron obtener métricas detalladas:', metricsError);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error verificando estado del sistema');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Monitor de Salud del Sistema
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkSystemHealth}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Actualizar'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Estado general */}
          {healthStatus && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(healthStatus.status)}
                <div>
                  <div className="font-medium">Estado del Sistema</div>
                  <div className="text-sm text-muted-foreground">
                    {healthStatus.message}
                  </div>
                </div>
              </div>
              <Badge variant={getStatusColor(healthStatus.status) as any}>
                {healthStatus.status.toUpperCase()}
              </Badge>
            </div>
          )}

          {/* Verificaciones detalladas */}
          {healthStatus?.checks && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memoria</span>
                  <Badge variant={getStatusColor(healthStatus.checks.memory.status) as any}>
                    {healthStatus.checks.memory.usage}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiempo de Respuesta</span>
                  <Badge variant={getStatusColor(healthStatus.checks.requests.status) as any}>
                    {healthStatus.checks.requests.averageResponseTime}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Errores Recientes</span>
                  <Badge variant={getStatusColor(healthStatus.checks.errors.status) as any}>
                    {healthStatus.checks.errors.recentErrors}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiempo Activo</span>
                  <Badge variant="outline">
                    {healthStatus.checks.uptime.duration}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Métricas del sistema (si están disponibles) */}
          {systemMetrics && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Métricas del Sistema
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Requests Totales</div>
                  <div className="font-medium">{systemMetrics.requests.total.toLocaleString()}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Tasa de Éxito</div>
                  <div className="font-medium">{systemMetrics.requests.successRate}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Cache</div>
                  <div className="font-medium">{systemMetrics.cache.size} elementos</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Memoria Heap</div>
                  <div className="font-medium">
                    {systemMetrics.process.memory.heapUsed} / {systemMetrics.process.memory.heapTotal}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Tiempo Activo</div>
                  <div className="font-medium">{systemMetrics.uptime.human}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-muted-foreground">Respuesta Promedio</div>
                  <div className="font-medium">{systemMetrics.requests.averageResponseTime}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
