# CAMBIOS NECESARIOS EN PROYECTO PYTHON

## Archivo: C:\wa-queue-api v2\main copy 6.7.py

### Cambio de puerto API (LÍNEA ~218):
```python
# ANTES
reaction_api_base_url = "http://100.42.185.2:8001"

# DESPUÉS 
reaction_api_base_url = "http://100.42.185.2:8015"
```

### Endpoint de medios (LÍNEA ~482) - MANTENER:
```python
# CORRECTO - Proyecto Python separado en puerto 8011
media_api_url = "http://100.42.185.2:8011/get-last-media/"
# Este endpoint usa v1 del backend - NO CAMBIAR
```

## ENDPOINTS CONFIRMADOS EN BACKEND (NO CAMBIAR):
✅ `/chats/{jid}` - Get Conversation (usado por reaction_check_url_val)
✅ `/chats/send` - Send Message
✅ `/sessions/*` - Session management 

## FRONTEND ACTUALIZADO:
✅ `gemini-api.ts` - Endpoint cambiado a `/wa/process` directo
✅ `gemini-store.ts` - Agregado token requerido
✅ Interface `ProcessIARequest` - Agregado campo token

## FLUJO FUNCIONAMIENTO:
1. Frontend configura sesión WhatsApp en `http://100.42.185.2:8015`
2. Webhook intercepta mensajes 
3. Mensaje enviado a Python en `http://localhost:8016/wa/process`
4. Python procesa con IA y responde via WhatsApp usando `http://100.42.185.2:8015`

## EMOJIS PARA MEDIOS (ya implementado en Python):
📷 imagen, 🎤 audio, 📄 documento, 📹 video
