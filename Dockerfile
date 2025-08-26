# ========== ETAPA DE DEPENDENCIAS ==========
FROM node:20-alpine AS deps
# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    cp -R node_modules prod_node_modules && \
    npm ci

# ========== ETAPA DE COMPILACIÓN ==========
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar archivos del proyecto
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para la compilación
# Estas se pueden sobrescribir en tiempo de build
ARG NEXT_PUBLIC_API_URL=https://backend.autosystemprojects.site
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Compilar la aplicación
RUN npm run build

# ========== ETAPA DE PRODUCCIÓN ==========
FROM node:20-alpine AS runner
WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Variables de entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar archivos necesarios desde la etapa de build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar node_modules de producción
COPY --from=deps /app/prod_node_modules ./node_modules

# Cambiar al usuario no-root
USER nextjs

# Exponer el puerto configurado (8016 para tu caso)
EXPOSE 8016

# Variables de entorno para el puerto
ENV PORT=8016
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar la aplicación
CMD ["node", "server.js"]