# App SAD Las - Gestión de Servicios a Domicilio

Aplicación web para la gestión integral de servicios de atención domiciliaria, desarrollada con Next.js 15, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características

### Gestión de Usuarios
- ✅ Registro y gestión de usuarios del servicio
- ✅ Información personal, contacto y notas
- ✅ Control de horas mensuales asignadas
- ✅ Estados activo/inactivo

### Gestión de Trabajadoras
- ✅ Registro completo de trabajadoras
- ✅ Especializaciones (cuidado de ancianos, discapacidad, asistencia médica, compañía)
- ✅ Configuración de disponibilidad y horarios
- ✅ Tarifas por hora y límites semanales
- ✅ Información de contacto de emergencia

### Sistema de Asignaciones
- ✅ Asignación de trabajadoras a usuarios
- ✅ Configuración de horarios específicos por día
- ✅ Prioridades y estados de asignación
- ✅ Control de horas semanales
- ✅ Detección de conflictos de horarios

### Planning y Calendario
- ✅ Vista semanal del planning
- ✅ Visualización de asignaciones por trabajadora
- ✅ Estadísticas de utilización
- ✅ Detección automática de conflictos

### Configuración del Sistema
- ✅ Configuración de empresa
- ✅ Parámetros del sistema
- ✅ Exportación de datos
- ✅ Gestión de usuarios administrativos

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **UI Components**: Lucide React Icons
- **Deployment**: Vercel (recomendado)

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd app-sad-las
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env.local
   ```
   
   Editar `.env.local` con tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Configurar la base de datos**
   
   Ejecutar el script SQL en tu proyecto de Supabase:
   ```bash
   # Copiar el contenido de supabase/schema.sql
   # y ejecutarlo en el SQL Editor de Supabase
   ```

5. **Ejecutar el proyecto**
   ```bash
   npm run dev
   ```

## 🗄️ Configuración de la Base de Datos

### Tablas Principales

1. **users** - Usuarios del servicio
2. **workers** - Trabajadoras
3. **assignments** - Asignaciones trabajadora-usuario
4. **service_cards** - Tarjetas de servicio mensuales
5. **service_days** - Días de servicio por semana
6. **worker_profiles** - Perfiles de trabajadoras (auth)

### Políticas de Seguridad (RLS)

El sistema incluye políticas de Row Level Security configuradas para:
- Usuarios autenticados pueden acceder a todas las tablas
- Trabajadoras pueden ver solo su propio perfil
- Triggers automáticos para crear perfiles al registrarse

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con Turbopack
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── dashboard/         # Panel administrativo
│   │   ├── users/         # Gestión de usuarios
│   │   ├── workers/       # Gestión de trabajadoras
│   │   ├── assignments/   # Gestión de asignaciones
│   │   ├── planning/      # Planning semanal
│   │   └── settings/      # Configuración
│   ├── login/             # Autenticación
│   └── register/          # Registro
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (Button, Card, etc.)
│   └── ...               # Componentes específicos
├── hooks/                # Custom hooks
├── lib/                  # Utilidades y configuración
└── middleware.ts         # Middleware de autenticación
```

## 🔐 Autenticación

El sistema utiliza Supabase Auth con:
- Registro de trabajadoras
- Login/logout
- Middleware de protección de rutas
- Perfiles automáticos

## 🎨 UI/UX

- **Diseño Responsive**: Optimizado para móvil y desktop
- **Tema**: Slate color palette con Tailwind CSS
- **Iconografía**: Lucide React
- **Componentes**: Sistema de diseño consistente

## 📊 Funcionalidades Avanzadas

### Detección de Conflictos
- Análisis automático de horarios superpuestos
- Alertas en tiempo real
- Sugerencias de resolución

### Estadísticas
- Utilización de trabajadoras
- Horas asignadas vs disponibles
- Métricas de rendimiento

### Exportación
- Datos en formato JSON
- Reportes de planning
- Backup de configuración

## 🚀 Deployment

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Otros
- Netlify
- Railway
- Docker

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo

## 🔄 Roadmap

- [ ] Notificaciones push
- [ ] App móvil nativa
- [ ] Integración con calendarios externos
- [ ] Sistema de facturación
- [ ] Reportes avanzados
- [ ] API pública
- [ ] Multi-tenant

---

**Desarrollado con ❤️ para mejorar la gestión de servicios de atención domiciliaria**
