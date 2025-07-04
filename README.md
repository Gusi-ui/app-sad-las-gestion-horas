# App SAD LAS - Gestión de Horas

Sistema de gestión de horas y asignaciones para trabajadores.

## Características

- Dashboard administrativo
- Gestión de trabajadores
- Asignación de tareas
- Planificación semanal
- Autenticación con Supabase
- Interfaz responsive

## Tecnologías

- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase
- React Hook Form
- Zod

## Instalación

```bash
npm install
npm run dev
```

## Variables de Entorno

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## Despliegue

La aplicación está configurada para desplegarse en Vercel con optimizaciones específicas.

---

*Última actualización: $(date)*
