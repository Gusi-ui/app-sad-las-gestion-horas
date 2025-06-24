# 🏥 Gestión de Servicios a Domicilio

Aplicación web moderna para trabajadoras de ayuda a domicilio. Permite gestionar usuarios, horarios y seguimiento de horas de manera eficiente y segura.

## 🚀 Características

- ✅ **Gestión de usuarios**: Alta, edición y eliminación de usuarios/clientes
- ⏰ **Control de horas**: Seguimiento de horas trabajadas y restantes
- 📅 **Planificación flexible**: Horarios por días de la semana, festivos y fines de semana
- 🔒 **Seguridad avanzada**: Autenticación y autorización con Row Level Security (RLS)
- 📱 **Responsive**: Optimizada para dispositivos móviles
- 🎨 **UI moderna**: Diseño elegante con Tailwind CSS

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilos**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: TanStack Query (React Query)
- **Validación**: Zod
- **Iconos**: Lucide React
- **Despliegue**: Vercel (frontend) + Supabase (backend)

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta en Supabase (gratuita)
- Cuenta en Vercel (opcional, para despliegue)

## 🔧 Configuración del Proyecto

### 1. Clonar y configurar el proyecto

```bash
# Clonar el repositorio
git clone <tu-repo>
cd app-sad-las

# Instalar dependencias
npm install
```

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings > API para obtener tus credenciales

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
```

### 4. Configurar la base de datos

1. En tu dashboard de Supabase, ve a SQL Editor
2. Ejecuta el contenido del archivo `supabase/schema.sql` para crear las tablas y políticas de seguridad

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── dashboard/         # Dashboard principal
│   ├── login/             # Página de login
│   ├── register/          # Página de registro
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página de inicio
│   └── providers.tsx      # Proveedores (React Query)
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes UI base
├── hooks/                # Hooks personalizados
├── lib/                  # Utilidades y configuraciones
└── middleware.ts         # Middleware de autenticación
```

## 🗃️ Base de Datos

### Tablas principales:

- **worker_profiles**: Perfiles de trabajadoras
- **users**: Usuarios/clientes
- **service_cards**: Tarjetas de servicio mensuales
- **service_days**: Días de servicio por semana

### Características de seguridad:

- **RLS (Row Level Security)**: Cada trabajadora solo ve sus propios datos
- **Políticas automáticas**: Inserción, actualización y eliminación controladas
- **Triggers**: Actualización automática de timestamps

## 🎯 Funcionalidades Principales

### Para Trabajadoras:
- Registrarse e iniciar sesión
- Gestionar usuarios (crear, editar, eliminar)
- Configurar horarios semanales por usuario
- Seguimiento de horas trabajadas/restantes
- Añadir notas a usuarios

### Para Administración (futuro):
- Panel de administración de empresa
- Asignación de usuarios a trabajadoras
- Reportes y estadísticas

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Despliega automáticamente

### Otras opciones gratuitas:
- Netlify
- Railway
- Render

## 🔒 Seguridad

- Autenticación con Supabase Auth
- Políticas RLS a nivel de base de datos
- Validación de datos con Zod
- Middleware de protección de rutas
- HTTPS por defecto en despliegue

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de [Next.js](https://nextjs.org/docs)
2. Consulta la documentación de [Supabase](https://supabase.com/docs)
3. Abre un issue en el repositorio

## 🔄 Roadmap

- [ ] Panel de administración de empresa
- [ ] Notificaciones push
- [ ] Exportación de reportes
- [ ] App móvil nativa
- [ ] Integración con calendarios
- [ ] Geolocalización de servicios

---

Desarrollado con ❤️ para trabajadoras de ayuda a domicilio
