#!/bin/bash

# Script para probar el build y deployment local del frontend
# Uso: ./test-docker-local.sh

echo "🚀 Iniciando prueba local del Docker para el Frontend..."

# Variables
IMAGE_NAME="appboots-frontend-test"
CONTAINER_NAME="appboots-frontend-test-container"
PORT=8016

# Detener y eliminar contenedor anterior si existe
echo "🧹 Limpiando contenedores anteriores..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Construir la imagen
echo "🔨 Construyendo imagen Docker..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://backend.autosystemprojects.site" \
  -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo "❌ Error al construir la imagen"
    exit 1
fi

echo "✅ Imagen construida exitosamente"

# Ejecutar el contenedor
echo "🏃 Ejecutando contenedor..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:$PORT \
  -e PORT=$PORT \
  -e HOSTNAME="0.0.0.0" \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL="https://backend.autosystemprojects.site" \
  $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo "❌ Error al ejecutar el contenedor"
    exit 1
fi

# Esperar a que el servicio esté listo
echo "⏳ Esperando a que el servicio esté listo..."
sleep 10

# Verificar que el contenedor esté corriendo
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ Contenedor ejecutándose correctamente"
    
    # Mostrar logs
    echo "📋 Últimas líneas del log:"
    docker logs --tail 20 $CONTAINER_NAME
    
    # Verificar que responda
    echo "🔍 Verificando servicio en http://localhost:$PORT"
    curl -f http://localhost:$PORT > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ El servicio responde correctamente"
        echo "🎉 Prueba exitosa! Puedes acceder a la aplicación en http://localhost:$PORT"
    else
        echo "⚠️  El servicio podría necesitar más tiempo para iniciar"
        echo "Verifica los logs con: docker logs $CONTAINER_NAME"
    fi
else
    echo "❌ El contenedor no está corriendo"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs: docker logs -f $CONTAINER_NAME"
echo "  - Detener: docker stop $CONTAINER_NAME"
echo "  - Eliminar: docker rm $CONTAINER_NAME"
echo "  - Entrar al contenedor: docker exec -it $CONTAINER_NAME sh"