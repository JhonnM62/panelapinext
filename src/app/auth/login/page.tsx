'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Eye, EyeOff, Smartphone, Monitor, Clock, AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{active: boolean, timeLeft: number} | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { login, isLoading, error, clearError } = useAuthStore()

  // Hook para rate limiting
  useEffect(() => {
    const checkRateLimit = () => {
      const retryAfter = localStorage.getItem('login_retry_after')
      if (retryAfter) {
        const retryAfterTime = parseInt(retryAfter)
        const now = Date.now()
        
        if (now < retryAfterTime) {
          const timeLeft = Math.ceil((retryAfterTime - now) / 1000)
          setRateLimitInfo({ active: true, timeLeft })
          return
        } else {
          localStorage.removeItem('login_retry_after')
          localStorage.removeItem('last_login_attempt')
        }
      }
      setRateLimitInfo(null)
    }
    
    checkRateLimit()
    const interval = setInterval(checkRateLimit, 1000)
    return () => clearInterval(interval)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      await login(data)
      toast({
        title: 'Éxito',
        description: 'Has iniciado sesión correctamente',
      })
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Credenciales inválidas',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2 text-primary">
              <Smartphone className="h-8 w-8" />
              <Monitor className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Baileys Admin</CardTitle>
          <CardDescription>
            Inicia sesión para acceder al panel de administración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Rate Limiting Alert */}
            {rateLimitInfo?.active && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-medium text-amber-800">Rate Limit Activo</h3>
                </div>
                <p className="text-sm text-amber-700">
                  Demasiadas peticiones detectadas. Intenta nuevamente en:
                </p>
                <div className="flex items-center justify-center space-x-2 bg-amber-100 rounded-md p-3">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-mono text-lg text-amber-800">
                    {Math.floor(rateLimitInfo.timeLeft / 60)}:{(rateLimitInfo.timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {error && !rateLimitInfo?.active && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || rateLimitInfo?.active}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2" size={16} />
                  Iniciando sesión...
                </>
              ) : rateLimitInfo?.active ? (
                'Rate Limit Activo'
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿No tienes una cuenta? </span>
              <Link
                href="/auth/register"
                className="text-primary hover:underline font-medium"
              >
                Regístrate aquí
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
