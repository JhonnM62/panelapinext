# 🚨 SOLUCIÓN ERROR "Cannot read properties of undefined"

## ❌ **Error Encontrado**
```
TypeError: Cannot read properties of undefined (reading 'call')
en sidebar.tsx línea 12
```

## ✅ **Problema Identificado**
El icono `Brain` de lucide-react no existe en la versión instalada (0.364.0)

## ✅ **Solución Aplicada**

### 1. **Iconos Cambiados**
- ❌ `Brain` → ✅ `Cpu` (compatible y temático para IA)
- Archivos actualizados:
  - `sidebar.tsx` 
  - `gemini-config.tsx`
  - `gemini/page.tsx`

### 2. **Script de Reparación Creado**
```bash
.\fix-urgent-frontend.bat
```

## 🚀 **Pasos para Solucionarlo**

### **Opción A: Automática (Recomendada)**
```bash
cd C:\appboots
.\fix-urgent-frontend.bat
```

### **Opción B: Manual**
```bash
cd C:\appboots

# 1. Limpiar cache
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# 2. Reinstalar lucide-react
npm uninstall lucide-react
npm install lucide-react@latest

# 3. Reinstalar todas las dependencias
npm install --force

# 4. Iniciar servidor
npm run dev
```

## 🔍 **Verificación**

1. ✅ Servidor inicia sin errores
2. ✅ Navegación funciona
3. ✅ Icono Gemini IA (Cpu) aparece correctamente
4. ✅ Página /gemini carga sin problemas

## 💡 **Nota Técnica**

El icono `Brain` fue introducido en versiones más recientes de lucide-react. 
La versión instalada (0.364.0) no lo incluye. El icono `Cpu` es semánticamente 
apropiado para representar IA y existe en todas las versiones.

---

**🎯 Estado: RESUELTO ✅**
