# 🚀 Configuración CI/CD para Frontend Next.js

## 📋 Resumen de la Configuración

Se ha configurado un pipeline completo de CI/CD para el frontend de Next.js que:

- ✅ Construye la aplicación con optimizaciones de producción
- ✅ Crea una imagen Docker multi-stage optimizada
- ✅ Despliega automáticamente al servidor en el puerto **8016**
- ✅ Se activa con cada push a la rama `main`

## 🔧 Archivos Creados

1. **`Dockerfile`** - Imagen Docker multi-stage con:

   - Etapa de dependencias
   - Etapa de compilación
   - Etapa de producción (imagen final optimizada)

2. **`.github/workflows/publish.yml`** - Pipeline de GitHub Actions

   - Build y push de imagen a GitHub Container Registry
   - Despliegue automático vía SSH

3. **`.dockerignore`** - Optimización del contexto de build

4. **Scripts de prueba local**:
   - `test-docker-local.sh` (Linux/Mac)
   - `test-docker-local.ps1` (Windows)

## 📦 Configuración en GitHub

### Secrets Necesarios

Asegúrate de tener configurados estos secrets en tu repositorio de GitHub:

| Secret                | Descripción                                    | Valor                                     |
| --------------------- | ---------------------------------------------- | ----------------------------------------- |
| `FRONT_TOKEN`         | Token de acceso para GitHub Container Registry | Ya configurado (antes era TOKEN_EXAMPLE)  |
| `AUTH_SERVER`         | Servidor SSH para deployment                   | Ya configurado                            |
| `AUTH_PASS`           | Contraseña SSH                                 | Ya configurado                            |
| `ENV_FILE_CONTENT`    | Contenido del archivo .env                     | Ya configurado                            |
| `NEXT_PUBLIC_API_URL` | URL del backend (opcional)                     | `https://backend.autosystemprojects.site` |

### Configurar el Token de GitHub

Si aún no tienes el `FRONT_TOKEN` configurado:

1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Genera un nuevo token con permisos:
   - `write:packages`
   - `read:packages`
   - `delete:packages`
3. Copia el token
4. Ve a tu repositorio → Settings → Secrets and variables → Actions
5. Añade un nuevo secret llamado `FRONT_TOKEN` con el valor del token

## 🚀 Proceso de Despliegue

### 1. Prueba Local (Recomendado)

**Windows (PowerShell):**

```powershell
.\test-docker-local.ps1
```

**Linux/Mac:**

```bash
chmod +x test-docker-local.sh
./test-docker-local.sh
```

### 2. Despliegue a Producción

```bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: configuración CI/CD para frontend"

# Push a la rama main (activa el pipeline)
git push origin main
```

## 🔄 Flujo del Pipeline

1. **Push a main** → Activa GitHub Actions
2. **Build** → Construye imagen Docker optimizada
3. **Push a Registry** → Sube imagen a ghcr.io
4. **Deploy** → Se conecta por SSH y despliega
5. **Verificación** → Comprueba que el servicio esté activo

## 🐳 Detalles Técnicos del Docker

### Multi-Stage Build

La imagen utiliza 3 etapas para optimización:

```dockerfile
# Etapa 1: Instalar dependencias
FROM node:20-alpine AS deps

# Etapa 2: Compilar aplicación
FROM node:20-alpine AS builder

# Etapa 3: Imagen final de producción
FROM node:20-alpine AS runner
```

### Características de Seguridad

- ✅ Usuario no-root (`nextjs`)
- ✅ Solo dependencias de producción
- ✅ Imagen Alpine Linux (ligera)
- ✅ Variables de entorno configurables

### Tamaño Optimizado

- Imagen base: ~120MB (Alpine)
- Aplicación compilada: ~50-100MB
- **Total estimado: ~200-250MB**

## 📊 Monitoreo Post-Despliegue

### Verificar el Contenedor

```bash
# Ver estado del contenedor
docker ps | grep appboots

# Ver logs en tiempo real
docker logs -f appboots-frontend

# Verificar uso de recursos
docker stats appboots-frontend
```

### Verificar el Servicio

```bash
# Verificar que responda
curl http://100.42.185.2:8016

# Verificar health (si tienes endpoint)
curl http://100.42.185.2:8016/api/health
```

## 🔍 Solución de Problemas

### El contenedor no inicia

1. Verificar logs:

```bash
docker logs appboots-frontend
```

2. Verificar variables de entorno:

```bash
docker exec appboots-frontend env
```

### Error de compilación

1. Verificar que todas las dependencias estén en `package.json`
2. Limpiar caché local:

```bash
rm -rf .next node_modules
npm install
npm run build
```

### Puerto ocupado

Si el puerto 8016 está ocupado:

```bash
# Linux/Mac
lsof -i :8016

# Windows
netstat -ano | findstr :8016
```

## 🔄 Actualización Manual

Si necesitas actualizar manualmente sin CI/CD:

```bash
# En el servidor
cd ~/proyectos/appboots

# Pull de la imagen más reciente
docker pull ghcr.io/[tu-usuario]/appboots:latest

# Reiniciar contenedor
docker stop appboots-frontend
docker rm appboots-frontend
docker run -d \
  --name appboots-frontend \
  -p 8016:8016 \
  --restart always \
  --env-file .env \
  ghcr.io/[tu-usuario]/appboots:latest
```

## 📝 Variables de Entorno

El frontend utiliza estas variables:

| Variable              | Descripción         | Valor por Defecto                         |
| --------------------- | ------------------- | ----------------------------------------- |
| `PORT`                | Puerto del servidor | `8016`                                    |
| `HOSTNAME`            | Host de binding     | `0.0.0.0`                                 |
| `NODE_ENV`            | Entorno             | `production`                              |
| `NEXT_PUBLIC_API_URL` | URL del backend     | `https://backend.autosystemprojects.site` |

## ✅ Checklist de Verificación

- [ ] Dockerfile creado y probado localmente
- [ ] GitHub Actions workflow configurado
- [ ] Secrets de GitHub configurados
- [ ] Prueba local exitosa
- [ ] Push a main realizado
- [ ] Pipeline ejecutado exitosamente
- [ ] Servicio accesible en puerto 8016

## 🎯 Próximos Pasos

1. **Configurar HTTPS** con certificado SSL
2. **Añadir health checks** en el Dockerfile
3. **Configurar backups** automáticos
4. **Implementar rollback** automático en caso de fallo
5. **Añadir notificaciones** de despliegue (Slack/Discord)

---

**Fecha de configuración:** 22 de Agosto, 2025
**Puerto de producción:** 8016
**URL de acceso:** http://100.42.185.2:8016
