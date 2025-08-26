"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGeminiConfig } from "@/store/gemini-store";
import { chatsAPI } from "@/lib/api"; // 🔧 Cambiar a chatsAPI
import { toast } from "@/components/ui/use-toast";

// 🆕 Event listener para el WebSocket global
declare global {
  interface Window {
    webhookNotifications?: {
      addEventListener: (
        type: string,
        listener: (event: CustomEvent) => void
      ) => void;
      removeEventListener: (
        type: string,
        listener: (event: CustomEvent) => void
      ) => void;
    };
  }
}

interface AutoProcessorProps {
  userToken: string;
  enabled?: boolean;
  onProcessingStart?: (message: any) => void;
  onProcessingComplete?: (result: any) => void;
  onError?: (error: any) => void;
}

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
    };
    videoMessage?: {
      caption?: string;
    };
  };
  messageTimestamp: number;
}

const AutoProcessor = React.memo(function AutoProcessor({
  userToken,
  enabled = true,
  onProcessingStart,
  onProcessingComplete,
  onError,
}: AutoProcessorProps) {
  const { config, hasValidConfig } = useGeminiConfig();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedMessages, setProcessedMessages] = useState<Set<string>>(
    new Set()
  );
  const lastProcessTime = useRef<number>(0);
  const processingQueue = useRef<WhatsAppMessage[]>([]);

  console.log("🤖 [AutoProcessor] Montado:", config?.sesionId, config?.activo);

  // 🆕 Escuchar notificaciones del sistema webhook que funciona
  useEffect(() => {
    if (!enabled || !config?.activo || !hasValidConfig) {
      console.log("🤖 [AutoProcessor] No activo - condiciones no cumplidas");
      return;
    }

    console.log("🤖 [AutoProcessor] 🔌 Conectando a notificaciones webhook...");

    // 🆕 Interceptar eventos del sistema webhook existente
    const handleNotification = (event: any) => {
      const data = event.detail || event;
      console.log(
        "🤖 [AutoProcessor] 📨 Notificación recibida:",
        data.eventType
      );

      if (
        data.eventType === "MESSAGES_UPSERT" &&
        data.sessionId === config.sesionId
      ) {
        console.log("🤖 [AutoProcessor] ✅ UPSERT válido para sesión");
        handleWebSocketMessage(data);
      }
    };

    // 🆕 Agregar listener al window para interceptar eventos
    if (typeof window !== "undefined") {
      window.addEventListener("webhook-notification", handleNotification);

      // 🆕 HACK: Interceptar mensajes del WebSocket existente
      const originalConsoleLog = console.log;
      const interceptor = (...args: any[]) => {
        if (
          args[0] &&
          typeof args[0] === "string" &&
          args[0].includes("Nueva notificación:") &&
          args[1]
        ) {
          const notification = args[1];
          if (
            notification.eventType === "MESSAGES_UPSERT" &&
            notification.sessionId === config.sesionId
          ) {
            console.log("🤖 [AutoProcessor] 🎣 Interceptado UPSERT!");
            handleWebSocketMessage(notification);
          }
        }
        return originalConsoleLog.apply(console, args);
      };

      console.log = interceptor;

      return () => {
        window.removeEventListener("webhook-notification", handleNotification);
        console.log = originalConsoleLog;
      };
    }
  }, [enabled, config?.activo, hasValidConfig, config?.sesionId]);

  const handleWebSocketMessage = async (message: any) => {
    console.log("🤖 [AutoProcessor] 📨 Procesando notificación UPSERT");

    try {
      const messages = message.eventData || [];
      console.log("🤖 [AutoProcessor] 📨", messages.length, "mensajes");

      for (const msg of messages) {
        if (shouldProcessMessage(msg)) {
          console.log("🤖 [AutoProcessor] ✅ Procesando:", msg.key?.id);
          await processMessageWithIA(msg);
        }
      }
    } catch (error) {
      console.error("🤖 [AutoProcessor] Error:", error);
      onError?.(error);
    }
  };

  const shouldProcessMessage = (message: WhatsAppMessage): boolean => {
    console.log("🤖 [AutoProcessor] shouldProcessMessage evaluando:", {
      messageId: message?.key?.id,
      fromMe: message?.key?.fromMe,
      hasId: !!message?.key?.id,
      alreadyProcessed: message?.key?.id
        ? processedMessages.has(message.key.id)
        : "no-id",
      timeSinceLastProcess: Date.now() - lastProcessTime.current,
    });

    // 🔧 Filtros de validación
    if (!message?.key?.id) {
      console.log("🤖 [AutoProcessor] ❌ Sin ID de mensaje");
      return false;
    }
    if (message.key.fromMe) {
      console.log("🤖 [AutoProcessor] ❌ Mensaje propio ignorado");
      return false;
    }
    if (processedMessages.has(message.key.id)) {
      console.log("🤖 [AutoProcessor] ❌ Mensaje ya procesado");
      return false;
    }

    // Rate limiting: no procesar más de 1 mensaje por 3 segundos
    const now = Date.now();
    if (now - lastProcessTime.current < 3000) {
      console.log("🤖 [AutoProcessor] ❌ Rate limiting activo");
      return false;
    }

    // Verificar que tenga contenido de texto
    const textContent = extractTextFromMessage(message);
    console.log("🤖 [AutoProcessor] Texto extraído:", {
      hasText: !!textContent,
      textLength: textContent?.length || 0,
      textPreview: textContent?.substring(0, 50) || "NO_TEXT",
    });

    if (!textContent || textContent.trim().length < 2) {
      console.log("🤖 [AutoProcessor] ❌ Sin contenido de texto válido");
      return false;
    }

    console.log("🤖 [AutoProcessor] ✅ Mensaje pasa todos los filtros");
    return true;
  };

  const extractTextFromMessage = (message: WhatsAppMessage): string => {
    const msg = message.message;
    if (!msg) return "";

    // Extraer texto según tipo de mensaje
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;

    return "";
  };

  const extractPhoneNumber = (remoteJid: string): string => {
    // Extraer número de WhatsApp del JID
    return remoteJid.split("@")[0].replace(/\D/g, "");
  };

  const processMessageWithIA = async (message: WhatsAppMessage) => {
    console.log("🤖 [AutoProcessor] 📢 processMessageWithIA iniciado:", {
      messageId: message.key?.id,
      isProcessing,
      queueLength: processingQueue.current.length,
    });

    if (isProcessing) {
      console.log("🤖 [AutoProcessor] 📋 Ya procesando, agregando a cola");
      processingQueue.current.push(message);
      return;
    }

    setIsProcessing(true);
    lastProcessTime.current = Date.now();

    try {
      processedMessages.add(message.key.id);

      const phoneNumber = extractPhoneNumber(message.key.remoteJid);
      const messageText = extractTextFromMessage(message);

      console.log("🤖 [AutoProcessor] 📨 Datos extraídos:", {
        phone: phoneNumber,
        textLength: messageText.length,
        textPreview: messageText.substring(0, 100),
        messageId: message.key.id,
        configActivo: config?.activo,
      });

      onProcessingStart?.(message);

      // Preparar datos para la API
      const requestData = {
        lineaWA: phoneNumber,
        mensaje_reciente: messageText,
        userbot: config?.sesionId,
        apikey: config?.apikey,
        server: config?.server || "https://backend.autosystemprojects.site",
        numerodemensajes: config?.numerodemensajes || 8,
        promt: config?.promt,
        pais: config?.pais || "colombia",
        idioma: config?.idioma || "es",
        delay_seconds: config?.delay_seconds || 8,
        temperature: config?.temperature || 0.0,
        topP: config?.topP || 0.9,
        maxOutputTokens: config?.maxOutputTokens || 512,
        pause_timeout_minutes: config?.pause_timeout_minutes || 30,
        ai_model: config?.ai_model || "gemini-2.5-flash",
        thinking_budget: config?.thinking_budget || -1,
      };

      console.log("🤖 [AutoProcessor] 📡 Llamando API con datos:", {
        hasApikey: !!requestData.apikey,
        hasPromt: !!requestData.promt,
        userbot: requestData.userbot,
        phone: requestData.lineaWA,
        messagePreview: requestData.mensaje_reciente.substring(0, 50),
      });

      // Llamar al endpoint /wa/process
      const response = await chatsAPI.processWithIA(userToken, requestData);

      console.log("🤖 [AutoProcessor] 📤 Respuesta API:", {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
      });

      if (response.success) {
        console.log("🤖 [AutoProcessor] ✅ Mensaje procesado exitosamente");
        onProcessingComplete?.(response.data);

        toast({
          title: "🤖 IA Activada",
          description: `Mensaje procesado para ${phoneNumber}`,
          duration: 2000,
        });
      } else {
        throw new Error(response.error || "Error procesando con IA");
      }
    } catch (error) {
      console.error("🤖 [AutoProcessor] ❌ Error completo:", {
        error: error,
        message: error instanceof Error ? error.message : "Unknown",
        stack: error instanceof Error ? error.stack : "No stack",
      });
      onError?.(error);

      toast({
        title: "❌ Error IA",
        description: "Error procesando mensaje automáticamente",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);

      // Procesar siguiente mensaje en cola
      setTimeout(() => {
        if (processingQueue.current.length > 0) {
          const nextMessage = processingQueue.current.shift();
          if (nextMessage) {
            console.log("🤖 [AutoProcessor] 🔄 Procesando siguiente en cola");
            processMessageWithIA(nextMessage);
          }
        }
      }, 1000);
    }
  };

  // Limpiar mensajes procesados cada 5 minutos
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (processedMessages.size > 100) {
        setProcessedMessages(new Set());
        console.log("🤖 [AutoProcessor] Cache de mensajes limpiado");
      }
    }, 300000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Componente invisible - solo lógica
  return null;
});

// Props memoization para evitar re-renders innecesarios
AutoProcessor.displayName = "AutoProcessor";

export default AutoProcessor;
