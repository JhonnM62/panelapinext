# NUEVOS ENDPOINTS BACKEND - GESTIÓN BOTS

## Colección: botscreados

### GET /api/v2/bots/user
**Obtener bots del usuario**
```json
Query: { "token": "user_token" }
Response: {
  "success": true,
  "data": [
    {
      "_id": "bot_id",
      "nombreBot": "Mi Bot Ventas", 
      "sesionId": "session_123",
      "numeroWhatsapp": "573001234567",
      "estadoBot": "activo",
      "fechaCreacion": "2025-06-27"
    }
  ]
}
```

### POST /api/v2/bots/create
**Crear nuevo bot**
```json
Body: {
  "token": "user_token",
  "nombreBot": "Mi Bot Soporte",
  "descripcion": "Bot de soporte técnico", 
  "sesionId": "session_456"
}
Validaciones:
- Límite por plan (14días=1, 6meses=3, 1año=5, vitalicio=10)
- Sesión no debe estar usada por otro bot
- Sesión debe existir y estar autenticada
```

### PUT /api/v2/bots/update/:botId
**Actualizar bot**
```json
Body: {
  "token": "user_token",
  "nombreBot": "Nuevo nombre",
  "estadoBot": "activo|inactivo"
}
```

### DELETE /api/v2/bots/delete/:botId
**Eliminar bot y su configuración**

### GET /api/v2/bots/sessions-available
**Sesiones disponibles para crear bots**
```json
Query: { "token": "user_token" }
Response: {
  "success": true,
  "data": [
    {
      "sesionId": "session_789",
      "numeroWhatsapp": "573009876543", 
      "estado": "authenticated",
      "disponible": true
    }
  ]
}
```

## Modificar endpoints existentes:

### POST /api/v2/gemini/config (modificar)
```json
Body: {
  "token": "user_token",
  "botId": "ObjectId_bot", // NUEVO campo
  "apikey": "gemini_key",
  "promt": "instrucciones...",
  // ... resto configuración
}
```

### GET /api/v2/gemini/config (modificar)  
```json
Query: { "token": "user_token", "botId": "ObjectId_bot" }
```

## Límites por plan:
- **14 días**: 1 bot
- **6 meses**: 3 bots  
- **1 año**: 5 bots
- **Vitalicio**: 10 bots
