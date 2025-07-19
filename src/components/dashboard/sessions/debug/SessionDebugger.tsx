'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'

interface EndpointTest {
  name: string
  endpoint: string
  method: 'GET' | 'POST'
  description: string
  expectsCode?: boolean
}

interface TestResult {
  success: boolean
  status: number
  data: any
  error?: string
  timestamp: string
  endpoint: string
}

export function SessionDebugger() {
  const [sessionId, setSessionId] = useState('')
  const [testing, setTesting] = useState<string | null>(null)
  const [results, setResults] = useState<TestResult[]>([])

  const endpoints: EndpointTest[] = [
    {
      name: 'Status',
      endpoint: '/status',
      method: 'GET',
      description: 'Obtener estado actual de la sesión'
    },
    {
      name: 'QR/Code',
      endpoint: '/qr',
      method: 'GET',
      description: 'Obtener QR o código de emparejamiento',
      expectsCode: true
    }
  ]

  const testEndpoint = async (test: EndpointTest) => {
    if (!sessionId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un Session ID",
        variant: "destructive"
      })
      return
    }

    setTesting(test.name)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v2/sesiones/${sessionId}${test.endpoint}`
      
      console.log(`[DEBUG] Probando ${test.name}: ${url}`)

      const response = await fetch(url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      const result: TestResult = {
        success: response.ok,
        status: response.status,
        data,
        timestamp: new Date().toLocaleTimeString(),
        endpoint: test.endpoint
      }

      console.log(`[DEBUG] Resultado ${test.name}:`, result)

      setResults(prev => [result, ...prev])

      // Verificar códigos de emparejamiento específicamente
      if (test.expectsCode && response.ok) {
        const possibleCodes = [
          data.data?.code,
          data.data?.pairingCode,
          data.code,
          data.pairingCode,
          data.data?.pairCode,
          data.pairCode
        ]

        const foundCode = possibleCodes.find(c => c && typeof c === 'string')
        
        if (foundCode) {
          toast({
            title: "¡Código encontrado!",
            description: `Código de emparejamiento: ${foundCode}`,
            variant: "default"
          })
        } else {
          console.log('[DEBUG] Ubicaciones revisadas para código:', possibleCodes)
          toast({
            title: "Sin código",
            description: "No se encontró código de emparejamiento en la respuesta",
            variant: "destructive"
          })
        }
      }

    } catch (error) {
      const result: TestResult = {
        success: false,
        status: 0,
        data: null,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toLocaleTimeString(),
        endpoint: test.endpoint
      }

      setResults(prev => [result, ...prev])
      
      toast({
        title: "Error en prueba",
        description: `${test.name}: ${result.error}`,
        variant: "destructive"
      })
    } finally {
      setTesting(null)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800'
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800'
    if (status >= 500) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Depurador de Sesiones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Session ID (ej: 68780364e768a6abff39245b)"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={clearResults}
              variant="outline"
              disabled={results.length === 0}
            >
              Limpiar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {endpoints.map((test) => (
              <Card key={test.name} className="border">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{test.name}</h4>
                      <Badge variant="outline">{test.method}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {test.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {test.endpoint}
                    </div>
                    <Button
                      onClick={() => testEndpoint(test)}
                      disabled={testing === test.name || !sessionId.trim()}
                      className="w-full"
                      size="sm"
                    >
                      {testing === test.name ? 'Probando...' : 'Probar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Resultados de Pruebas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result, index) => (
              <Card key={index} className="border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={getStatusColor(result.status)}
                        >
                          {result.status || 'ERROR'}
                        </Badge>
                        <span className="font-medium">{result.endpoint}</span>
                        <span className="text-sm text-muted-foreground">
                          {result.timestamp}
                        </span>
                      </div>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? 'Éxito' : 'Error'}
                      </Badge>
                    </div>

                    {result.error && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {result.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {result.data && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Respuesta:</h5>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                        
                        {/* Análisis específico para códigos */}
                        {result.endpoint === '/qr' && result.data && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm">🔍 Análisis de Código:</h5>
                            <div className="bg-blue-50 p-3 rounded text-xs">
                              {[
                                ['data.data?.code', result.data.data?.code],
                                ['data.data?.pairingCode', result.data.data?.pairingCode],
                                ['data.code', result.data.code],
                                ['data.pairingCode', result.data.pairingCode],
                                ['data.data?.pairCode', result.data.data?.pairCode],
                                ['data.pairCode', result.data.pairCode]
                              ].map(([path, value]) => (
                                <div key={path} className="flex justify-between">
                                  <span>{path}:</span>
                                  <span className={value ? 'text-green-600 font-bold' : 'text-gray-400'}>
                                    {value || 'null'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
