# 🏗️ Plan de Implementación - Nueva Arquitectura SAD LAS

## 📋 Resumen Ejecutivo

Este documento detalla el plan de implementación para rediseñar completamente el sistema SAD LAS con una arquitectura robusta, escalable y segura que solucione los problemas actuales de gestión de trabajadoras, usuarios y planificaciones.

## 🎯 Objetivos Principales

1. **Separación clara de roles y accesos**
2. **Base de datos robusta y sin conflictos**
3. **Panel administrativo independiente**
4. **App móvil para trabajadoras**
5. **Sistema de planificación inteligente**

## 🏛️ Nueva Arquitectura

### **1. Separación de Aplicaciones**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SUPER ADMIN   │    │   ADMIN PANEL   │    │  WORKER APP     │
│   (Dashboard)   │    │   (Dashboard)   │    │   (Mobile)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   SUPABASE DB   │
                    │  (PostgreSQL)   │
                    └─────────────────┘
```

### **2. Roles y Permisos**

| Rol | Acceso | Funciones |
|-----|--------|-----------|
| **Super Admin** | Solo Panel Admin | • Gestionar administradores<br>• Configuración del sistema<br>• Reportes globales |
| **Admin** | Panel Admin | • Gestionar trabajadoras<br>• Gestionar usuarios<br>• Gestionar asignaciones<br>• Planificación |
| **Worker** | Solo App Móvil | • Ver su planning<br>• Actualizar estado<br>• Notas de servicio |

## 📊 Nueva Estructura de Base de Datos

### **Tablas Principales**

1. **`system_roles`** - Roles del sistema
2. **`admins`** - Administradores
3. **`workers`** - Trabajadoras (con tipo específico)
4. **`users`** - Clientes/Usuarios
5. **`assignments`** - Asignaciones trabajadora-usuario
6. **`monthly_plans`** - Planificación mensual
7. **`service_days`** - Días de servicio específicos
8. **`holidays`** - Festivos
9. **`system_alerts`** - Alertas y conflictos

### **Mejoras Clave**

- ✅ **Tipos de trabajadora claros**: `regular`, `holidays`, `weekends`, `flexible`
- ✅ **Códigos únicos**: `employee_code` para trabajadoras, `client_code` para usuarios
- ✅ **Relaciones robustas**: Sin duplicados ni conflictos
- ✅ **Auditoría completa**: Quién creó qué y cuándo
- ✅ **Validaciones**: Constraints y triggers automáticos

## 🚀 Plan de Implementación

### **Fase 1: Base de Datos (Semana 1)**

#### **1.1 Crear nuevo proyecto Supabase**
```bash
# Crear proyecto en Supabase
# Aplicar nuevo esquema
# Configurar RLS y políticas
```

#### **1.2 Migrar datos existentes (si los hay)**
```sql
-- Script de migración de datos antiguos
-- Mapeo de tipos de trabajadora
-- Limpieza de datos duplicados
```

#### **1.3 Configurar autenticación**
```typescript
// Configurar Supabase Auth
// Roles y permisos
// Políticas RLS
```

### **Fase 2: Panel Administrativo (Semanas 2-3)**

#### **2.1 Estructura de carpetas**
```
src/
├── app/
│   ├── admin/           # Panel administrativo
│   │   ├── dashboard/
│   │   ├── workers/
│   │   ├── users/
│   │   ├── assignments/
│   │   └── planning/
│   └── worker/          # App de trabajadoras (futuro)
├── components/
│   ├── admin/           # Componentes del panel admin
│   └── shared/          # Componentes compartidos
├── lib/
│   ├── types-new.ts     # Nuevos tipos
│   ├── supabase-new.ts  # Cliente Supabase
│   └── utils/           # Utilidades
```

#### **2.2 Páginas principales del admin**
- **Dashboard**: Resumen general, métricas, alertas
- **Trabajadoras**: CRUD completo, gestión de tipos
- **Usuarios**: CRUD completo, información médica
- **Asignaciones**: Crear, editar, gestionar conflictos
- **Planificación**: Planning mensual, calendario

#### **2.3 Componentes clave**
- `WorkerForm` - Formulario completo de trabajadora
- `UserForm` - Formulario completo de usuario
- `AssignmentForm` - Gestión de asignaciones
- `MonthlyPlanForm` - Planificación mensual
- `ConflictResolver` - Resolución de conflictos

### **Fase 3: Lógica de Cálculo Avanzada (Semana 4)**

#### **3.1 Engine de cálculo de horas**
```typescript
class HourCalculationEngine {
  calculateMonthlyHours(worker: Worker, user: User, month: number, year: number): HourCalculation
  detectConflicts(assignment: Assignment): Conflict[]
  generateMonthlyPlan(assignment: Assignment, month: number, year: number): MonthlyPlan
  validateSchedule(schedule: Record<WeekDay, ScheduleTime>): ValidationResult
}
```

#### **3.2 Sistema de conflictos**
```typescript
interface Conflict {
  type: 'overlap' | 'overtime' | 'unavailable' | 'holiday_conflict'
  severity: 'error' | 'warning' | 'info'
  description: string
  suggestedSolution: string
}
```

#### **3.3 Predicciones inteligentes**
```typescript
interface HourPrediction {
  monthly: number
  quarterly: number
  yearly: number
  confidence: number
  factors: string[]
}
```

### **Fase 4: Interfaz Mejorada (Semana 5)**

#### **4.1 Dashboard inteligente**
- **Métricas en tiempo real**
- **Alertas automáticas**
- **Gráficos de rendimiento**
- **Filtros avanzados**

#### **4.2 Gestión de conflictos**
- **Panel de alertas**
- **Resolución automática**
- **Notificaciones**
- **Historial de conflictos**

#### **4.3 Reportes avanzados**
- **Reportes mensuales**
- **Análisis de eficiencia**
- **Métricas de trabajadoras**
- **Cobertura de servicio**

### **Fase 5: App Móvil (Semanas 6-7)**

#### **5.1 Estructura de la app**
```
worker-app/
├── src/
│   ├── screens/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Schedule/
│   │   ├── ServiceDetails/
│   │   └── Profile/
│   ├── components/
│   └── services/
```

#### **5.2 Funcionalidades principales**
- **Login con credenciales del admin**
- **Ver planning personal**
- **Actualizar estado de servicios**
- **Notas de servicio**
- **Notificaciones**

## 🔧 Configuración Técnica

### **Variables de Entorno**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_VERSION=2.0.0
```

### **Dependencias Nuevas**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@tanstack/react-query": "^5.0.0",
    "date-fns": "^2.30.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "recharts": "^2.8.0"
  }
}
```

## 📱 Flujo de Usuario

### **Super Admin**
1. **Login** → Panel administrativo
2. **Gestionar administradores** → Crear/editar admins
3. **Configuración** → Ajustes del sistema
4. **Reportes** → Métricas globales

### **Admin**
1. **Login** → Panel administrativo
2. **Dashboard** → Resumen y alertas
3. **Trabajadoras** → CRUD completo
4. **Usuarios** → CRUD completo
5. **Asignaciones** → Crear y gestionar
6. **Planificación** → Planning mensual

### **Trabajadora**
1. **Login** → App móvil (credenciales del admin)
2. **Dashboard** → Resumen personal
3. **Schedule** → Ver planning
4. **Service Details** → Actualizar estado
5. **Profile** → Información personal

## 🛡️ Seguridad y Validaciones

### **Autenticación**
- **Supabase Auth** con roles específicos
- **JWT tokens** con expiración
- **Refresh tokens** automáticos

### **Autorización**
- **Row Level Security (RLS)** en todas las tablas
- **Políticas específicas** por rol
- **Validación de permisos** en frontend

### **Validaciones**
- **Zod schemas** para formularios
- **Validaciones de base de datos** con constraints
- **Validaciones de negocio** en el backend

## 📈 Métricas y KPIs

### **Métricas de Trabajadoras**
- Horas trabajadas vs planificadas
- Eficiencia por trabajadora
- Satisfacción del cliente
- Confiabilidad (asistencias vs ausencias)

### **Métricas de Usuarios**
- Cobertura de servicio
- Calidad del servicio
- Horas utilizadas vs asignadas
- Satisfacción general

### **Métricas del Sistema**
- Utilización de recursos
- Conflictos resueltos
- Tiempo de respuesta
- Disponibilidad del servicio

## 🚨 Gestión de Conflictos

### **Tipos de Conflictos**
1. **Solapamiento de horarios**
2. **Sobrecarga de trabajadora**
3. **Festivos no cubiertos**
4. **Fines de semana sin servicio**
5. **Usuarios sin asignación**

### **Resolución Automática**
- **Algoritmos de optimización**
- **Sugerencias inteligentes**
- **Notificaciones automáticas**
- **Escalación manual**

## 📅 Cronograma Detallado

| Semana | Fase | Tareas | Entregables |
|--------|------|--------|-------------|
| 1 | Base de Datos | • Crear proyecto Supabase<br>• Aplicar esquema<br>• Configurar RLS | Base de datos funcional |
| 2-3 | Panel Admin | • Estructura de carpetas<br>• Páginas principales<br>• Componentes básicos | Panel admin funcional |
| 4 | Lógica Avanzada | • Engine de cálculo<br>• Sistema de conflictos<br>• Predicciones | Lógica robusta |
| 5 | Interfaz | • Dashboard mejorado<br>• Gestión de conflictos<br>• Reportes | Interfaz completa |
| 6-7 | App Móvil | • Estructura básica<br>• Funcionalidades core<br>• Testing | App móvil MVP |

## 🎯 Criterios de Éxito

### **Funcionales**
- ✅ Gestión completa de trabajadoras sin conflictos
- ✅ Planificación mensual robusta
- ✅ Cálculo de horas preciso
- ✅ Separación clara de roles

### **Técnicos**
- ✅ Base de datos sin errores
- ✅ Interfaz responsive
- ✅ Performance optimizada
- ✅ Seguridad implementada

### **Usuarios**
- ✅ Admin puede gestionar todo
- ✅ Trabajadoras ven su planning
- ✅ Sin confusiones de roles
- ✅ Experiencia fluida

## 🔄 Migración y Despliegue

### **Migración de Datos**
1. **Backup** de datos existentes
2. **Script de migración** automático
3. **Validación** de datos migrados
4. **Testing** completo

### **Despliegue**
1. **Vercel** para panel admin
2. **Expo** para app móvil
3. **Supabase** para base de datos
4. **Monitoreo** continuo

---

## 📞 Próximos Pasos

1. **Aprobar** este plan de implementación
2. **Crear** nuevo proyecto Supabase
3. **Aplicar** nuevo esquema de base de datos
4. **Comenzar** con Fase 1

¿Te parece bien este plan? ¿Quieres que empecemos con alguna fase específica o necesitas ajustar algo? 