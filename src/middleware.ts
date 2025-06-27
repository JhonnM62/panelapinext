import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Solo aplicar middleware a rutas específicas
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // En un middleware real, aquí verificarías el token y rol del usuario
    // Por ahora, solo verificamos que exista un token en las cookies o headers
    
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      // Redirigir a login si no hay token
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Aquí podrías decodificar el JWT y verificar el rol
    // Por simplicidad, asumimos que si existe token, continúa
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
