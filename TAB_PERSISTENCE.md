# Persistencia de Tabs en localStorage

## Funcionalidad Implementada

Se ha implementado un sistema completo de persistencia de tabs que guarda y restaura automáticamente los tabs entre sesiones del navegador.

## Características

### 🔄 **Persistencia Automática**
- **Auto-save**: Los tabs se guardan automáticamente en localStorage cada vez que cambian
- **Auto-restore**: Al abrir la aplicación, se restauran automáticamente los tabs de la sesión anterior
- **Estado completo**: Se guarda el nombre, request, y cuál tab está activo

### 🛡️ **Validación y Seguridad**
- **Versionado**: Sistema de versiones para compatibilidad futura
- **Validación de datos**: Verifica la integridad de los datos almacenados
- **Expiración**: Los datos se eliminan automáticamente después de 30 días
- **Manejo de errores**: Fallback graceful si hay problemas con localStorage

### 🎯 **Experiencia de Usuario**
- **Notificación de restauración**: Informa al usuario cuando se restauran tabs
- **Opción de limpiar**: Botón para empezar con tabs limpios
- **Auto-dismiss**: La notificación se oculta automáticamente después de 5 segundos

## Archivos Implementados

### 1. `src/utils/tabStorage.ts`
Utilidades para manejar localStorage:

```typescript
export const tabStorage = {
  saveTabs: (tabs: Tab[]) => void,      // Guardar tabs
  loadTabs: () => Tab[] | null,         // Cargar tabs
  clearTabs: () => void,                // Limpiar storage
  hasStoredTabs: () => boolean,         // Verificar si hay tabs guardados
}
```

**Características:**
- ✅ Versionado de datos (`version: '1.0'`)
- ✅ Timestamp para expiración (30 días)
- ✅ Validación de estructura de datos
- ✅ Manejo de errores con try/catch
- ✅ Normalización de tabs (solo uno activo)

### 2. `src/contexts/TabContext.tsx` (Modificado)
Contexto actualizado con persistencia:

**Nuevas funcionalidades:**
- ✅ Inicialización desde localStorage
- ✅ Auto-save en cada cambio
- ✅ Función `clearAllTabs()`
- ✅ Flag `hasStoredTabs`

### 3. `src/components/Layout/TabRestoreNotification.tsx`
Componente de notificación:

**Características:**
- ✅ Aparece solo una vez por sesión
- ✅ Auto-hide después de 5 segundos
- ✅ Botón "Got it" para dismissar
- ✅ Botón "Start Fresh" para limpiar tabs
- ✅ Animación slide-in

### 4. `src/components/Layout/TabOptions.tsx`
Menú de opciones para tabs:

**Funcionalidades:**
- ✅ Contador de tabs abiertos
- ✅ Opción "Clear All Tabs"
- ✅ Confirmación antes de limpiar
- ✅ Menú dropdown con backdrop

### 5. `src/index.css` (Actualizado)
Estilos para animaciones:

```css
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

## Estructura de Datos

### Formato de Almacenamiento
```typescript
interface StoredTabsData {
  version: string;        // "1.0"
  tabs: Tab[];           // Array de tabs
  timestamp: number;     // Timestamp de guardado
}
```

### Estructura de Tab
```typescript
interface Tab {
  id: string;                    // ID único del tab
  name: string;                  // Nombre mostrado
  request: HttpRequest | null;   // Request completo o null
  isActive: boolean;             // Si está activo
}
```

## Flujo de Funcionamiento

### 1. **Inicialización**
```
App Start → TabContext → tabStorage.loadTabs() → 
Validate Data → Restore Tabs → Show Notification
```

### 2. **Guardado Automático**
```
Tab Change → useEffect → tabStorage.saveTabs() → localStorage
```

### 3. **Limpieza**
```
User Action → clearAllTabs() → tabStorage.clearTabs() → 
Reset to Default Tab
```

## Validaciones Implementadas

### ✅ **Validación de Versión**
- Verifica que la versión sea compatible
- Limpia datos si la versión no coincide

### ✅ **Validación de Estructura**
- Verifica que `tabs` sea un array
- Valida campos requeridos de cada tab
- Filtra tabs inválidos

### ✅ **Validación de Tiempo**
- Elimina datos más antiguos de 30 días
- Previene acumulación de datos obsoletos

### ✅ **Validación de Estado**
- Asegura que solo un tab esté activo
- Activa el último tab si ninguno está activo
- Maneja casos edge gracefully

## Beneficios

### 🚀 **Productividad**
- **Continuidad**: Continúa donde lo dejaste
- **Sin pérdida**: No pierdes trabajo al cerrar el navegador
- **Contexto preservado**: Mantiene el estado completo de cada request

### 🛡️ **Confiabilidad**
- **Manejo de errores**: Fallback graceful en caso de problemas
- **Validación robusta**: Datos siempre consistentes
- **Limpieza automática**: No acumula datos obsoletos

### 🎨 **UX Mejorada**
- **Transparente**: Funciona automáticamente sin intervención
- **Informativo**: Notifica cuando restaura tabs
- **Control**: Opción de empezar limpio cuando se desee

## Casos de Uso

### ✅ **Escenarios Soportados**
- Cerrar y abrir navegador
- Refrescar página (F5)
- Cerrar tab del navegador y volver
- Crash del navegador
- Reinicio del sistema

### ✅ **Manejo de Errores**
- localStorage no disponible
- Datos corruptos
- Cuota de storage excedida
- Datos muy antiguos
- Estructura inválida

## Configuración

### Constantes Configurables
```typescript
const TABS_STORAGE_KEY = 'kiro-tabs';     // Clave en localStorage
const STORAGE_VERSION = '1.0';           // Versión de datos
const EXPIRY_DAYS = 30;                  // Días antes de expirar
const NOTIFICATION_TIMEOUT = 5000;       // Auto-hide notification (ms)
```

## Próximas Mejoras Posibles

- 🔄 **Sincronización en la nube**: Compartir tabs entre dispositivos
- 📊 **Estadísticas**: Tracking de uso de tabs
- 🎨 **Temas**: Persistir preferencias de UI
- 🔍 **Búsqueda**: Buscar en tabs guardados
- 📱 **Responsive**: Adaptación para móviles
- 🔐 **Encriptación**: Encriptar datos sensibles