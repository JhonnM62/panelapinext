'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ArrowLeft, ExternalLink, Cpu } from 'lucide-react';
import Link from 'next/link';

// Importar el componente refactorizado dinámicamente para evitar problemas de hydratación
const GeminiConfigRefactored = dynamic(() => import('@/components/gemini/GeminiConfigRefactored'), {
  ssr: false,
  loading: () => (
    <Card>
      <CardContent className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
        <div className="text-center text-muted-foreground">Cargando configuración avanzada...</div>
      </CardContent>
    </Card>
  )
});

export default function GeminiConfigPage() {
  const { user, token, isLoading } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (!mounted || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-pulse">Cargando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !token) {
    return null;
  }

  const handleConfigSaved = () => {
    // Opcional: redirigir o mostrar mensaje de éxito
    console.log('Configuración de Gemini guardada exitosamente');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sessions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Sesiones
            </Link>
          </Button>
          <div className="flex items-center space-x-2">
            <Cpu className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold">Configuración de Gemini IA</h1>
              <p className="text-gray-600">
                Configura tu asistente de inteligencia artificial para WhatsApp
              </p>
            </div>
          </div>
        </div>
        
        <Button variant="outline" size="sm" asChild>
          <Link href="https://makersuite.google.com/app/apikey" target="_blank">
            <ExternalLink className="w-4 h-4 mr-2" />
            Obtener API Key
          </Link>
        </Button>
      </div>

      {/* Información importante */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Cpu className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-medium text-blue-900">¿Qué es Gemini IA?</h3>
              <p className="text-sm text-blue-800">
                Gemini es el modelo de inteligencia artificial de Google que permite crear respuestas 
                automáticas inteligentes para tus conversaciones de WhatsApp. Una vez configurado, 
                tu bot podrá responder de manera natural y contextual a los mensajes que reciba.
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-blue-700">
                  • <strong>API Key:</strong> Obtén tu clave gratuita en Google AI Studio
                </p>
                <p className="text-xs text-blue-700">
                  • <strong>Prompt:</strong> Define cómo debe comportarse tu asistente
                </p>
                <p className="text-xs text-blue-700">
                  • <strong>Configuración:</strong> Ajusta parámetros para personalizar las respuestas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente de configuración refactorizado */}
      <GeminiConfigRefactored 
        userToken={token} 
        onConfigSaved={handleConfigSaved}
      />

      {/* Información adicional */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-medium text-yellow-900">💡 Consejos para una mejor configuración</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Sé específico en tu prompt sobre el papel del asistente</li>
              <li>• Ajusta la temperatura según qué tan creativas quieras las respuestas</li>
              <li>• Usa el modo de prueba para verificar el comportamiento antes de activar</li>
              <li>• Configura timeouts apropiados para evitar respuestas no deseadas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
