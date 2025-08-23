// 🔧 NUEVA FUNCIÓN: Agregar al final del archivo webhooks.tsx (antes del return)

const cleanupOrphanedWebhooks = async () => {
  if (!user?.nombrebot) return;
  
  try {
    console.log('🧹 [WEBHOOK CLEANUP] Verificando webhooks órfanos...');
    
    const userId = user.nombrebot;
    const availableSessionIds = sessions.map(s => s.id);
    
    // Verificar si hay webhook configurado
    const statsResponse = await fetch(
      \`http://100.42.185.2:8015/webhook/stats/\${userId}\`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );
    
    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      
      if (statsResult.success && statsResult.data?.configExists) {
        const webhookSessionId = statsResult.data.sessionId;
        
        if (!availableSessionIds.includes(webhookSessionId)) {
          console.log('🧹 [WEBHOOK CLEANUP] ⚠️ WEBHOOK ÓRFANO DETECTADO:', {
            webhookSessionId,
            availableSessions: availableSessionIds,
            webhookActive: statsResult.data.webhookActive
          });
          
          // Notificar al usuario sin ser intrusivo
          toast({
            title: "⚠️ Configuración de Webhook",
            description: \`Webhook configurado para sesión \${webhookSessionId} que ya no existe. Considera crear uno nuevo.\`,
            variant: "default", // No destructive, solo informativo
            duration: 6000
          });
          
          // Actualizar stats para reflejar estado órfano
          setWebhookStats(prev => prev ? {
            ...prev,
            webhookActive: false,
            orphaned: true,
            orphanedSessionId: webhookSessionId
          } : null);
          
          // Limpiar configuración local del webhook órfano
          setWebhookConfig(null);
          
          console.log('🧹 [WEBHOOK CLEANUP] Estado actualizado - webhook marcado como órfano');
        } else {
          console.log('🧹 [WEBHOOK CLEANUP] ✅ Webhook válido - sesión existe');
        }
      }
    }
  } catch (error) {
    console.warn('🧹 [WEBHOOK CLEANUP] Error en verificación:', error);
  }
};

// AGREGAR esta llamada al useEffect de loadInitialData:
useEffect(() => {
  if (!user) return;

  const initializeData = async () => {
    await loadInitialData();
    
    // Verificar webhooks órfanos después de cargar sesiones
    setTimeout(() => {
      if (sessions.length > 0) {
        cleanupOrphanedWebhooks();
      }
    }, 2000);
  };
  
  initializeData();
  
  // ... resto del código del useEffect
}, [user]);
