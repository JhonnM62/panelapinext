import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

function getTokenFromRequest(request: NextRequest): string | null {
  // Intentar obtener token de cookies primero
  const cookieToken = request.cookies.get('token')?.value
  if (cookieToken) return cookieToken
  
  // Luego intentar desde headers Authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }
  
  // Finalmente intentar desde headers x-access-token
  const accessToken = request.headers.get('x-access-token')
  if (accessToken) return accessToken
  
  return null
}

function isTokenValid(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token)
    const now = Date.now() / 1000
    
    // Verificar si el token ha expirado
    if (decoded.exp && decoded.exp < now) {
      console.log('[Middleware] Token expirado')
      return false
    }
    
    return true
  } catch (error) {
    console.error('[Middleware] Error decodificando token:', error)
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas que requieren autenticación
  const protectedRoutes = ['/admin', '/dashboard', '/gemini']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    const token = getTokenFromRequest(request)
    
    if (!token) {
      console.log('[Middleware] No se encontró token, redirigiendo a login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    if (!isTokenValid(token)) {
      console.log('[Middleware] Token inválido o expirado, redirigiendo a login')
      const response = NextResponse.redirect(new URL('/auth/login', request.url))
      
      // Limpiar cookies de autenticación
      response.cookies.delete('token')
      response.cookies.delete('baileys_token')
      
      return response
    }
    
    // Token válido, continuar
    console.log('[Middleware] Token válido, permitiendo acceso')
  }

  return NextResponse.next()
}

export const config = {
  // Especificar qué rutas deben pasar por el middleware
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/gemini/:path*'
  ]
}
