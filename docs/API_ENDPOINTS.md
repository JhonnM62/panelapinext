# Documentación de Endpoints - Baileys API

**Base URL:** `https://backend.autosystemprojects.site`

## Autenticación

La API utiliza JWT para autenticación. La autenticación puede estar deshabilitada en desarrollo (`DISABLE_AUTH=true`).

**Headers requeridos:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

## 📱 Sessions - Gestión de Sesiones WhatsApp

### GET `/sessions/list`

Obtiene la lista de todas las sesiones.

- **Response:** Array de sesiones

### GET `/sessions/find/:id`

Obtiene información de una sesión específica.

- **Params:** `id` - ID de la sesión
- **Response:** Datos de la sesión

### GET `/sessions/status/:id`

Obtiene el estado de una sesión específica.

- **Params:** `id` - ID de la sesión
- **Response:** Estado de la sesión (conectado, desconectado, etc.)

### POST `/sessions/add`

Crea una nueva sesión.

- **Body:**
  ```json
  {
    "id": "session_id",
    "token": "user_token"
  }
  ```
- **Response:** Datos de la sesión creada

### DELETE `/sessions/delete/:id`

Elimina una sesión específica.

- **Params:** `id` - ID de la sesión
- **Response:** Confirmación de eliminación

## 💬 Chats - Gestión de Mensajes

### GET `/chats?id=session_id`

Obtiene la lista de chats de una sesión.

- **Query:** `id` - ID de la sesión
- **Response:** Array de chats

### GET `/chats/:jid?id=session_id`

Obtiene mensajes de un chat específico.

- **Params:** `jid` - ID del chat
- **Query:** `id` - ID de la sesión
- **Response:** Array de mensajes

### POST `/chats/send?id=session_id`

Envía un mensaje.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "receiver": "recipient_number",
    "message": "text_message"
  }
  ```
- **Response:** Información del mensaje enviado

### POST `/chats/reply?id=session_id`

Responde a un mensaje específico.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "receiver": "recipient_number",
    "messageContent": {},
    "quotedMessageId": "message_id",
    "isGroup": false,
    "quotedChatJid": "chat_jid",
    "isQuotedChatGroup": false
  }
  ```

### POST `/chats/edit?id=session_id`

Edita un mensaje enviado.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "chatJid": "chat_jid",
    "messageId": "message_id",
    "newText": "new_text",
    "isGroup": false
  }
  ```

### POST `/chats/pin?id=session_id`

Fija o desfija un chat.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "chatJid": "chat_jid",
    "pinState": true,
    "isGroup": false
  }
  ```

### POST `/chats/send-bulk?id=session_id`

Envía mensajes en lote.

- **Query:** `id` - ID de la sesión
- **Body:** Array de objetos mensaje

### POST `/chats/forward?id=session_id`

Reenvía un mensaje.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "forward": {},
    "receiver": "recipient_number",
    "isGroup": false
  }
  ```

### POST `/chats/read?id=session_id`

Marca mensajes como leídos.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "keys": []
  }
  ```

### POST `/chats/send-presence?id=session_id`

Envía estado de presencia (escribiendo, grabando, etc.).

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "receiver": "recipient_number",
    "presence": "composing"
  }
  ```
- **Valores válidos para presence:** `unavailable`, `available`, `composing`, `recording`, `paused`

### POST `/chats/download-media?id=session_id`

Descarga media de un mensaje.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "remoteJid": "chat_jid",
    "messageId": "message_id"
  }
  ```

### POST `/chats/delete?id=session_id`

Elimina un chat.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "receiver": "chat_jid",
    "message": {}
  }
  ```

### POST `/chats/labels/add-to-chat?id=session_id`

Añade etiqueta a un chat.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "chatJid": "chat_jid",
    "labelId": "label_id",
    "isGroup": false
  }
  ```

### POST `/chats/labels/remove-from-chat?id=session_id`

Remueve etiqueta de un chat.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "chatJid": "chat_jid",
    "labelId": "label_id",
    "isGroup": false
  }
  ```

## 👥 Groups - Gestión de Grupos

### GET `/groups?id=session_id`

Obtiene la lista de grupos.

- **Query:** `id` - ID de la sesión
- **Response:** Array de grupos

### POST `/groups/create?id=session_id`

Crea un nuevo grupo.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "groupName": "Nombre del Grupo",
    "participants": ["participant1", "participant2"]
  }
  ```

### POST `/groups/send/:jid?id=session_id`

Envía mensaje a un grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "receiver": "group_jid",
    "message": "text_message"
  }
  ```

### GET `/groups/:jid?id=session_id`

Obtiene mensajes de un grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión

### GET `/groups/meta/:jid?id=session_id`

Obtiene metadatos de un grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión

### POST `/groups/participants-update/:jid?id=session_id`

Actualiza participantes del grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "action": "add|remove|promote|demote",
    "participants": ["participant1", "participant2"]
  }
  ```

### POST `/groups/subject-update/:jid?id=session_id`

Actualiza el nombre del grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "subject": "Nuevo nombre del grupo"
  }
  ```

### POST `/groups/description-update/:jid?id=session_id`

Actualiza la descripción del grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "description": "Nueva descripción"
  }
  ```

### POST `/groups/setting-update/:jid?id=session_id`

Actualiza configuración del grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "settings": {}
  }
  ```

### POST `/groups/leave/:jid?id=session_id`

Abandona un grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión

### GET `/groups/invite-code/:jid?id=session_id`

Obtiene código de invitación del grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión

### POST `/groups/accept-invite?id=session_id`

Acepta invitación a grupo.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "invite": "invite_code"
  }
  ```

### POST `/groups/revoke-code/:jid?id=session_id`

Revoca código de invitación.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión

### POST `/groups/profile-picture/:jid?id=session_id`

Actualiza foto de perfil del grupo.

- **Params:** `jid` - ID del grupo
- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "url": "image_url"
  }
  ```

### POST `/groups/get-participants?id=session_id`

Obtiene lista de grupos sin participantes.

- **Query:** `id` - ID de la sesión

## 🔧 Misc - Funciones Misceláneas

### POST `/misc/update-profile-status?id=session_id`

Actualiza estado del perfil.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "status": "Mi nuevo estado"
  }
  ```

### POST `/misc/update-profile-name?id=session_id`

Actualiza nombre del perfil.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "name": "Mi nuevo nombre"
  }
  ```

### POST `/misc/my-profile?id=session_id`

Obtiene información del perfil propio.

- **Query:** `id` - ID de la sesión

### POST `/misc/profile-picture?id=session_id`

Obtiene foto de perfil de un usuario.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "jid": "user_jid",
    "isGroup": false
  }
  ```

### POST `/misc/set-profile-picture?id=session_id`

Establece foto de perfil.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "url": "image_url"
  }
  ```

### POST `/misc/block-and-unblock?id=session_id`

Bloquea o desbloquea un contacto.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "jid": "contact_jid",
    "isBlock": true
  }
  ```

### POST `/misc/public-story-status?id=session_id`

Comparte estado/historia.

- **Query:** `id` - ID de la sesión
- **Body:**
  ```json
  {
    "receiver": "recipient",
    "message": "story_content"
  }
  ```

## 🔗 Webhook - Sistema de Webhooks

### POST `/webhook/create`

Crea webhook para usuario.

- **Body:**
  ```json
  {
    "userId": "user_id",
    "sessionId": "session_id",
    "events": ["ALL"],
    "webhookUrl": "https://example.com/webhook"
  }
  ```

### POST `/webhook/:webhookId`

Recibe webhook de usuario específico.

- **Params:** `webhookId` - ID del webhook
- **Body:** Datos del webhook

### GET `/webhook/notifications/:userId`

Obtiene notificaciones de usuario.

- **Params:** `userId` - ID del usuario
- **Query:** `limit`, `offset`

### PUT `/webhook/notifications/:userId/:notificationId/read`

Marca notificación como leída.

- **Params:** `userId`, `notificationId`

### PUT `/webhook/configure/:userId`

Configura URL de webhook del cliente.

- **Params:** `userId` - ID del usuario
- **Body:**
  ```json
  {
    "webhookUrl": "https://example.com/webhook",
    "events": ["message", "status"],
    "active": true
  }
  ```

### GET `/webhook/stats/:userId`

Obtiene estadísticas de webhook.

- **Params:** `userId` - ID del usuario

## 🏥 Health - Monitoreo del Sistema

### GET `/health`

Verifica el estado del servidor.

- **Response:** Estado del sistema

## 🔐 Auth - Autenticación

### POST `/api/auth/signin`

Iniciar sesión.

### POST `/api/auth/signup`

Registrar usuario.

### POST `/api/users/*`

Operaciones de usuarios.

## Notas Importantes

1. **Autenticación:** La mayoría de endpoints requieren autenticación JWT excepto health y algunos webhook endpoints.

2. **Session ID:** Muchos endpoints requieren el parámetro `id` que corresponde al ID de la sesión de WhatsApp.

3. **Formato de números:** Los números de teléfono deben incluir código de país (ej: "5491234567890").

4. **Webhooks:** El sistema incluye un robusto sistema de webhooks para notificaciones en tiempo real.

5. **Base URL:** Todos los endpoints deben ser precedidos por `https://backend.autosystemprojects.site`.
