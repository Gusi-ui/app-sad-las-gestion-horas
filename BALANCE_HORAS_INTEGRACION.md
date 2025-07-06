# Sistema de Balance de Horas - Integración Completa

## Resumen
Se ha implementado un sistema completo de balance de horas mensuales que permite a la administración generar y validar balances, y a las trabajadoras visualizar su estado de horas de forma clara y centralizada.

## Componentes Implementados

### 1. Hook de Consulta (`useMonthlyBalance.ts`)
- **Ubicación**: `src/hooks/useMonthlyBalance.ts`
- **Función**: Consulta los balances mensuales de una trabajadora desde la API
- **Uso**: Se integra automáticamente en el dashboard de la trabajadora

### 2. Componente de Visualización (`MonthlyBalanceCard.tsx`)
- **Ubicación**: `src/components/MonthlyBalanceCard.tsx`
- **Función**: Muestra el balance mensual con diseño moderno y responsive
- **Características**:
  - Estados visuales diferenciados (en camino, exceso, disponible, completado)
  - Barra de progreso visual
  - Métricas claras (asignadas, programadas, balance)
  - Mensajes informativos

### 3. API de Consulta (`/api/worker/monthly-balance`)
- **Ubicación**: `src/app/api/worker/monthly-balance/route.ts`
- **Función**: Endpoint seguro para que las trabajadoras consulten sus balances
- **Seguridad**: Verifica autenticación y autorización

### 4. Componente de Administración (`AdminBalanceGenerator.tsx`)
- **Ubicación**: `src/components/AdminBalanceGenerator.tsx`
- **Función**: Interfaz para que la administración genere balances
- **Uso**: Se puede integrar en cualquier página de administración

## Flujo de Trabajo

### Para Administración:
1. **Generar Balance**: Usar el endpoint `/api/admin/generate-balance` con:
   ```json
   {
     "workerId": "uuid",
     "userId": "uuid", 
     "month": 12,
     "year": 2024,
     "planning": {...},
     "assignedHours": 40
   }
   ```

2. **Validar Resultado**: El sistema calcula automáticamente:
   - Horas programadas vs asignadas
   - Balance (positivo = horas libres, negativo = exceso)
   - Estado del mes
   - Mensaje informativo para la trabajadora

### Para Trabajadoras:
1. **Acceso Automático**: El dashboard ya incluye la sección "Balance Mensual de Horas"
2. **Visualización Clara**: Cada usuario muestra:
   - Nombre y dirección del usuario
   - Horas asignadas, programadas y balance
   - Estado visual (colores e iconos)
   - Progreso del mes
   - Mensaje personalizado

## Estados del Balance

| Estado | Descripción | Color | Icono |
|--------|-------------|-------|-------|
| `on_track` | Horas dentro del límite | Verde | 📈 |
| `over_scheduled` | Exceso de horas | Naranja | ⚠️ |
| `under_scheduled` | Horas disponibles | Azul | 📉 |
| `completed` | Mes completado | Verde | ✅ |

## Integración en el Dashboard

El dashboard de la trabajadora (`/worker/dashboard`) ahora incluye:

1. **Sección de Balance Mensual**: Muestra todos los balances del mes actual
2. **Botón de Actualización**: Para refrescar datos en tiempo real
3. **Diseño Responsive**: Funciona en móvil y desktop
4. **Estados de Carga**: Loading states y manejo de errores

## Ejemplo de Uso

### Generar Balance desde Administración:
```tsx
import { AdminBalanceGenerator } from '@/components/AdminBalanceGenerator';

<AdminBalanceGenerator
  workerId="worker-uuid"
  userId="user-uuid"
  month={12}
  year={2024}
  planning={monthlyPlanning}
  assignedHours={40}
  onSuccess={() => console.log('Balance generado')}
/>
```

### Consultar Balances (Automático):
```tsx
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';

const { balances, loading, error, refetch } = useMonthlyBalance(workerId);
```

## Ventajas del Sistema

1. **Centralizado**: Toda la lógica de cálculo está en el backend
2. **Seguro**: Verificación de autenticación y autorización
3. **Validado**: Los balances son generados y validados por administración
4. **Visual**: Interfaz clara y moderna para las trabajadoras
5. **Escalable**: Fácil de extender con nuevas funcionalidades
6. **Trazable**: Historial completo de balances generados

## Próximos Pasos Sugeridos

1. **Notificaciones**: Implementar alertas cuando se generen nuevos balances
2. **Histórico**: Página para ver balances de meses anteriores
3. **Exportación**: Generar reportes PDF de balances
4. **Ajustes**: Permitir a administración modificar balances existentes
5. **Métricas**: Dashboard con estadísticas generales de horas

## Archivos Modificados/Creados

- ✅ `src/hooks/useMonthlyBalance.ts` (NUEVO)
- ✅ `src/components/MonthlyBalanceCard.tsx` (NUEVO)
- ✅ `src/components/AdminBalanceGenerator.tsx` (NUEVO)
- ✅ `src/app/api/worker/monthly-balance/route.ts` (NUEVO)
- ✅ `src/app/worker/dashboard/page.tsx` (MODIFICADO)

El sistema está listo para producción y proporciona una experiencia completa de gestión de horas mensuales. 