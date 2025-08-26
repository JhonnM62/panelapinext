# Script para probar el build y deployment local del frontend en Windows
# Uso: .\test-docker-local.ps1

Write-Host "🚀 Iniciando prueba local del Docker para el Frontend..." -ForegroundColor Green

# Variables
$IMAGE_NAME = "appboots-frontend-test"
$CONTAINER_NAME = "appboots-frontend-test-container"
$PORT = 8016

# Detener y eliminar contenedor anterior si existe
Write-Host "🧹 Limpiando contenedores anteriores..." -ForegroundColor Yellow
docker stop $CONTAINER_NAME 2>$null
docker rm $CONTAINER_NAME 2>$null

# Construir la imagen
Write-Host "🔨 Construyendo imagen Docker..." -ForegroundColor Yellow
docker build `
  --build-arg NEXT_PUBLIC_API_URL="https://backend.autosystemprojects.site" `
  -t $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Imagen construida exitosamente" -ForegroundColor Green

# Ejecutar el contenedor
Write-Host "🏃 Ejecutando contenedor..." -ForegroundColor Yellow
docker run -d `
  --name $CONTAINER_NAME `
  -p ${PORT}:${PORT} `
  -e PORT=$PORT `
  -e HOSTNAME="0.0.0.0" `
  -e NODE_ENV=production `
  -e NEXT_PUBLIC_API_URL="https://backend.autosystemprojects.site" `
  $IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al ejecutar el contenedor" -ForegroundColor Red
    exit 1
}

# Esperar a que el servicio esté listo
Write-Host "⏳ Esperando a que el servicio esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar que el contenedor esté corriendo
$containerRunning = docker ps | Select-String $CONTAINER_NAME

if ($containerRunning) {
    Write-Host "✅ Contenedor ejecutándose correctamente" -ForegroundColor Green
    
    # Mostrar logs
    Write-Host "📋 Últimas líneas del log:" -ForegroundColor Cyan
    docker logs --tail 20 $CONTAINER_NAME
    
    # Verificar que responda
    Write-Host "🔍 Verificando servicio en http://localhost:$PORT" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$PORT" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ El servicio responde correctamente" -ForegroundColor Green
            Write-Host "🎉 Prueba exitosa! Puedes acceder a la aplicación en http://localhost:$PORT" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  El servicio podría necesitar más tiempo para iniciar" -ForegroundColor Yellow
        Write-Host "Verifica los logs con: docker logs $CONTAINER_NAME" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ El contenedor no está corriendo" -ForegroundColor Red
    docker logs $CONTAINER_NAME
    exit 1
}

Write-Host ""
Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
Write-Host "  - Ver logs: docker logs -f $CONTAINER_NAME"
Write-Host "  - Detener: docker stop $CONTAINER_NAME"
Write-Host "  - Eliminar: docker rm $CONTAINER_NAME"
Write-Host "  - Entrar al contenedor: docker exec -it $CONTAINER_NAME sh"