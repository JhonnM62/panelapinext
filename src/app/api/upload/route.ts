import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Configuración de Next.js 14 App Router
export const runtime = 'nodejs' // Use Node.js runtime
export const maxDuration = 60 // Tiempo máximo de ejecución en segundos

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Crear directorio de uploads si no existe
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const fileName = `${timestamp}_${randomString}.${fileExtension}`

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Guardar el archivo
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Construir URL del archivo
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host')
    const baseUrl = `${protocol}://${host}`
    const fileUrl = `${baseUrl}/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Configuración de Next.js 14 para el límite de tamaño
// En Next.js 14 con App Router, el límite se configura diferente
// El límite por defecto es suficiente para archivos de 50MB
