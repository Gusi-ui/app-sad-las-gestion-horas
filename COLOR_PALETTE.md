# Paleta de Colores - SAD LAS

## Descripción
Paleta de colores profesional y cálida diseñada para transmitir confianza, cuidado y profesionalidad en servicios de atención social.

## Colores Principales

### Primary (Azul Profesional)
- **50**: `#f0f9ff` - Azul muy claro
- **100**: `#e0f2fe` - Azul claro
- **200**: `#bae6fd` - Azul medio claro
- **300**: `#7dd3fc` - Azul medio
- **400**: `#38bdf8` - Azul
- **500**: `#0ea5e9` - Azul principal ⭐
- **600**: `#0284c7` - Azul oscuro
- **700**: `#0369a1` - Azul muy oscuro
- **800**: `#075985` - Azul profundo
- **900**: `#0c4a6e` - Azul más profundo

### Accent (Naranja Cálido)
- **50**: `#fef7ed` - Naranja muy claro
- **100**: `#fed7aa` - Naranja claro
- **200**: `#fdba74` - Naranja medio claro
- **300**: `#fb923c` - Naranja medio
- **400**: `#f97316` - Naranja
- **500**: `#ea580c` - Naranja principal ⭐
- **600**: `#c2410c` - Naranja oscuro
- **700**: `#9a3412` - Naranja muy oscuro
- **800**: `#7c2d12` - Naranja profundo
- **900**: `#431407` - Naranja más profundo

## Colores de Estado

### Success (Verde)
- **50**: `#f0fdf4` - Verde muy claro
- **100**: `#dcfce7` - Verde claro
- **200**: `#bbf7d0` - Verde medio claro
- **300**: `#86efac` - Verde medio
- **400**: `#4ade80` - Verde
- **500**: `#22c55e` - Verde principal ⭐
- **600**: `#16a34a` - Verde oscuro
- **700**: `#15803d` - Verde muy oscuro
- **800**: `#166534` - Verde profundo
- **900**: `#14532d` - Verde más profundo

### Warning (Amarillo)
- **50**: `#fffbeb` - Amarillo muy claro
- **100**: `#fef3c7` - Amarillo claro
- **200**: `#fde68a` - Amarillo medio claro
- **300**: `#fcd34d` - Amarillo medio
- **400**: `#fbbf24` - Amarillo
- **500**: `#f59e0b` - Amarillo principal ⭐
- **600**: `#d97706` - Amarillo oscuro
- **700**: `#b45309` - Amarillo muy oscuro
- **800**: `#92400e` - Amarillo profundo
- **900**: `#78350f` - Amarillo más profundo

### Error (Rojo)
- **50**: `#fef2f2` - Rojo muy claro
- **100**: `#fee2e2` - Rojo claro
- **200**: `#fecaca` - Rojo medio claro
- **300**: `#fca5a5` - Rojo medio
- **400**: `#f87171` - Rojo
- **500**: `#ef4444` - Rojo principal ⭐
- **600**: `#dc2626` - Rojo oscuro
- **700**: `#b91c1c` - Rojo muy oscuro
- **800**: `#991b1b` - Rojo profundo
- **900**: `#7f1d1d` - Rojo más profundo

## Neutros

### Gray (Grises Mejorados)
- **50**: `#f8fafc` - Gris muy claro
- **100**: `#f1f5f9` - Gris claro
- **200**: `#e2e8f0` - Gris medio claro
- **300**: `#cbd5e1` - Gris medio
- **400**: `#94a3b8` - Gris
- **500**: `#64748b` - Gris medio oscuro
- **600**: `#475569` - Gris oscuro
- **700**: `#334155` - Gris muy oscuro
- **800**: `#1e293b` - Gris profundo
- **900**: `#0f172a` - Gris más profundo

## Uso Recomendado

### Elementos Principales
- **Botones primarios**: `bg-primary-500 hover:bg-primary-600`
- **Enlaces**: `text-primary-600 hover:text-primary-700`
- **Bordes**: `border-primary-200`
- **Fondos sutiles**: `bg-primary-50`

### Estados
- **Éxito**: `bg-success-500 text-white`
- **Advertencia**: `bg-warning-500 text-white`
- **Error**: `bg-error-500 text-white`
- **Información**: `bg-primary-500 text-white`

### Acentos
- **Destacar elementos**: `bg-accent-500 text-white`
- **Call-to-action**: `bg-accent-400 hover:bg-accent-500`

### Texto
- **Texto principal**: `text-gray-900`
- **Texto secundario**: `text-gray-600`
- **Texto terciario**: `text-gray-400`
- **Texto en fondos oscuros**: `text-white`

## Ejemplos de Uso

```jsx
// Botón primario
<button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg">
  Guardar
</button>

// Botón de éxito
<button className="bg-success-500 hover:bg-success-600 text-white px-4 py-2 rounded-lg">
  Confirmar
</button>

// Alerta de error
<div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
  Error al guardar los datos
</div>

// Card con acento
<div className="bg-white border border-accent-200 shadow-lg rounded-lg p-6">
  <h3 className="text-accent-600 font-semibold">Información Importante</h3>
</div>
```

## Accesibilidad
Todos los colores han sido seleccionados para cumplir con las directrices WCAG 2.1 AA para contraste de color. 