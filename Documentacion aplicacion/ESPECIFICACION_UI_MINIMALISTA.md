# Especificación de UI Minimalista y Responsive

**Objetivo**: Definir cómo debe ser la interfaz: estilos, componentes, layout, y comportamiento en diferentes dispositivos.

---

## 🎨 FILOSOFÍA DE DISEÑO

### Principios Minimalistas

1. **Menos es más**
   - Solo lo esencial visible
   - Eliminar clutter visual
   - Máximo 3 colores principales

2. **Claridad**
   - Tipografía clara y legible
   - Espacios en blanco generosos
   - Contraste suficiente (WCAG AA mínimo)

3. **Eficiencia**
   - Acciones con máximo 2 clicks
   - Sin animaciones innecesarias
   - Carga rápida

4. **Accesibilidad**
   - Trabajo sin mouse (keyboard nav)
   - Trabajo sin color (iconos + texto)
   - Tamaños de fuente legibles (mín 14px)

---

## 🎯 SISTEMA DE COLORES

### Paleta Base (3 colores)

| Color | Código | Uso |
|-------|--------|-----|
| **Primario** | `#1F2937` | Fondos, textos principal |
| **Secundario** | `#3B82F6` | Botones, enlaces, acciones |
| **Neutro** | `#E5E7EB` | Bordes, fondos secundarios |

### Estados

| Estado | Color | Uso |
|--------|-------|-----|
| **Éxito** | `#10B981` | Confirmaciones, gastos registrados |
| **Error** | `#EF4444` | Errores, validaciones fallidas |
| **Advertencia** | `#F59E0B` | Cuotas próximas a vencer |
| **Info** | `#3B82F6` | Información, ayuda |

### Categorías de Gastos (Colores Predefinidos)

```
Alimentación:      #FF6B6B (rojo)
Transporte:        #4ECDC4 (cyan)
Entretenimiento:   #45B7D1 (azul)
Servicios:         #96CEB4 (verde)
Salud:             #FFEAA7 (amarillo)
Educación:         #DDA15E (marrón)
Otros:             #C0C0C0 (gris)
```

---

## 📐 TIPOGRAFÍA

### Fuentes

- **Familia principal**: Sistema (Segoe UI, Roboto, San Francisco)
- **Monoespaciada**: Fira Code (solo para números/montos)

### Escalas

| Elemento | Tamaño | Peso | Línea | Uso |
|----------|--------|------|-------|-----|
| **H1 (Títulos)** | 32px | 700 | 1.2 | Títulos de página |
| **H2 (Subtítulos)** | 24px | 600 | 1.3 | Secciones principales |
| **H3 (Labels)** | 18px | 600 | 1.4 | Encabezados de sección |
| **Párrafo** | 16px | 400 | 1.5 | Texto body |
| **Pequeño** | 14px | 400 | 1.5 | Textos secundarios |
| **Mínimo** | 12px | 400 | 1.4 | Ayudas, notas |
| **Moneda** | 20px | 600 | 1 | Montos/números |

---

## 🧩 COMPONENTES UI BÁSICOS

### 1. Botones

#### Estilos

**Primario** (Acciones principales)
```
Fondo: #3B82F6
Texto: Blanco
Padding: 12px 24px
Border-radius: 6px
Font-size: 14px
Hover: #2563EB (oscurecer 10%)
```

**Secundario** (Acciones menos importantes)
```
Fondo: #E5E7EB
Texto: #1F2937
Padding: 12px 24px
Border-radius: 6px
Font-size: 14px
Hover: #D1D5DB
```

**Peligro** (Eliminar, riesgosos)
```
Fondo: #EF4444
Texto: Blanco
Padding: 12px 24px
Border-radius: 6px
Font-size: 14px
Hover: #DC2626
```

**Sin fondo** (Links, acciones terciarias)
```
Fondo: Transparente
Texto: #3B82F6
Padding: 12px 24px
Border: 1px #3B82F6
Font-size: 14px
Hover: Fondo #EFF6FF
```

#### Tamaños

| Tamaño | Padding | Font-size | Uso |
|--------|---------|-----------|-----|
| **Grande** | 16px 32px | 16px | CTAs principales |
| **Medio** | 12px 24px | 14px | Acciones comunes |
| **Pequeño** | 8px 16px | 12px | Acciones inline |

### 2. Inputs/Campos

```
Border: 1px #E5E7EB
Border-radius: 6px
Padding: 12px
Font-size: 14px
Font-family: Sistema o monospace (para números)

Estados:
- Default: #E5E7EB
- Focus: #3B82F6 (borde 2px)
- Error: #EF4444
- Disabled: #D1D5DB (gris, no editable)

Placeholder: #9CA3AF (gris medio, 70% opacidad)
```

### 3. Cards/Contenedores

```
Fondo: Blanco
Border: 1px #E5E7EB
Border-radius: 8px
Padding: 16px
Box-shadow: 0 1px 3px rgba(0,0,0,0.1)

Hover: Shadow más pronunciada (hover effect sutil)
```

### 4. Alertas

```
Éxito:
  Fondo: #ECFDF5
  Borde: 1px #10B981
  Texto: #065F46
  Icono: ✓

Error:
  Fondo: #FEF2F2
  Borde: 1px #EF4444
  Texto: #7F1D1D
  Icono: ✕

Advertencia:
  Fondo: #FFFBEB
  Borde: 1px #F59E0B
  Texto: #78350F
  Icono: !

Info:
  Fondo: #EFF6FF
  Borde: 1px #3B82F6
  Texto: #1E40AF
  Icono: ⓘ
```

### 5. Tablas

```
Header:
  Fondo: #F3F4F6
  Borde inferior: 2px #E5E7EB
  Font-weight: 600
  Padding: 12px

Filas:
  Fondo: Blanco
  Borde inferior: 1px #E5E7EB
  Padding: 12px
  Hover: #F9FAFB (fondo muy sutil)

Alternado:
  Filas pares: #F9FAFB
  Filas impares: Blanco

Células:
  Padding: 12px
  Text-align: left (excepto números)
```

### 6. Modales/Diálogos

```
Overlay:
  Fondo: rgba(0,0,0,0.5)
  Z-index: 50

Modal:
  Fondo: Blanco
  Border-radius: 8px
  Box-shadow: 0 20px 25px rgba(0,0,0,0.15)
  Padding: 24px
  Max-width: 500px (mobile: 90vw)
  Position: centered

Cierre:
  Botón X en esquina superior derecha
  Tamaño: 24x24px
  Color: #6B7280 (gris)
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints

```
Mobile:      0px - 640px    (default, mobile-first)
Tablet:      641px - 1024px
Desktop:     1025px+

CSS:
@media (min-width: 641px) { /* Tablet */ }
@media (min-width: 1025px) { /* Desktop */ }
```

### Comportamiento por Tamaño

#### Mobile (< 640px)

- Navegación: Hamburger menu (3 líneas)
- Layout: Single column
- Padding: 16px
- Font-size: Mínimo 16px (evitar zoom automático)
- Botones: Full-width o apilados
- Cards: Full-width, padding 12px
- Tablas: Convertir a lista (stack vertical)

#### Tablet (641px - 1024px)

- Navegación: Sidebar colapsable o top nav
- Layout: 2 columnas donde aplique
- Padding: 20px
- Cards: 2 por fila
- Tablas: Horizontal scrollable si es necesario

#### Desktop (1025px+)

- Navegación: Sidebar permanente
- Layout: 3+ columnas
- Padding: 24px
- Cards: 3-4 por fila
- Tablas: Normal

### Componentes Responsivos

#### Navbar

```
Mobile:
  Height: 56px
  Flex: row, space-between
  Logo: 32px
  Menu: Icon burger
  Padding: 0 16px

Tablet+:
  Height: 64px
  Flex: row, space-around
  Logo: 40px
  Menu: Links visibles
  Padding: 0 20px
```

#### Sidebar

```
Mobile:
  Visible: No (hidden by default)
  Toggle: Burger menu
  Overlay: Sí (cuando abierto)
  Width: 80vw
  Position: Fixed, left

Desktop:
  Visible: Sí (siempre)
  Toggle: No (siempre visible)
  Width: 240px
  Position: Sticky
```

#### Listados/Tablas

```
Mobile:
  Mostrar solo: ID, Descripción, Monto
  Acciones: Icon (no texto)
  Detalles: Click para expandir

Tablet:
  Mostrar: ID, Descripción, Categoría, Monto, Acción
  Detalles: Click fila

Desktop:
  Mostrar: Todo
  Detalles: Hover muestra más info
```

---

## 🎯 LAYOUT PRINCIPAL

### Estructura General

```
┌─────────────────────────────────────┐
│          NAVBAR (64px)              │
├─────────────┬───────────────────────┤
│             │                       │
│   SIDEBAR   │     CONTENIDO         │
│  (240px)    │     PRINCIPAL         │
│             │                       │
│             │                       │
├─────────────┴───────────────────────┤
│          FOOTER (48px) - Opcional   │
└─────────────────────────────────────┘
```

### Espaciado

| Elemento | Top | Right | Bottom | Left | Uso |
|----------|-----|-------|--------|------|-----|
| **Contenedor principal** | 0 | auto | 0 | auto | Max-width 1280px |
| **Cards** | 16px | 16px | 16px | 16px | Mobile |
| **Secciones** | 24px | 0 | 24px | 0 | Vertical spacing |
| **Elementos inline** | 0 | 12px | 0 | 12px | Horizontal spacing |

---

## 📄 PÁGINAS Y LAYOUTS

### 1. Login/Register

**Layout:**
```
┌─────────────────────────┐
│                         │
│       Logo (64x64)      │
│                         │
│    Título de página     │
│                         │
│   ┌─────────────────┐   │
│   │  Email input    │   │
│   ├─────────────────┤   │
│   │ Password input  │   │
│   ├─────────────────┤   │
│   │  [Botón Login]  │   │
│   └─────────────────┘   │
│                         │
│   ¿No tienes cuenta?    │
│   [Link Registro]       │
│                         │
└─────────────────────────┘
```

**Especificación:**
- Ancho máximo: 400px (mobile: 100% - 32px)
- Centrado vertical y horizontal
- Sin sidebar ni navbar (solo en dashboard)
- Fondo: #F9FAFB

### 2. Dashboard

**Layout:**
```
┌───────────────────────────────────────┐
│         [Navbar]                      │
├────────────┬────────────────────────────┤
│            │  Título: Dashboard         │
│  [Sidebar] │  Fecha: Mes Actual         │
│            │                            │
│            │  ┌─────────────────────┐   │
│            │  │ Gasto Total    [$$] │   │
│            │  ├─────────────────────┤   │
│            │  │ Categoría Mayor [%] │   │
│            │  ├─────────────────────┤   │
│            │  │ Cash vs Card [Chart]│   │
│            │  └─────────────────────┘   │
│            │                            │
│            │  ┌─────────────────────┐   │
│            │  │ Cuotas próximas     │   │
│            │  │ [Lista simple]      │   │
│            │  └─────────────────────┘   │
│            │                            │
└────────────┴────────────────────────────┘
```

**Cards de resumen:**
- 4 cards en desktop (1 cada)
- 2 cards en tablet
- 1 card en mobile

### 3. Listado de Gastos

**Layout:**
```
┌────────────────────────────────┐
│ Filtros (desplegable/collapsible)│
├────────────────────────────────┤
│ Fecha:  [picker]               │
│ Categoría: [dropdown]          │
│ Monto: [input min] - [input max]│
│ [Aplicar] [Limpiar]            │
├────────────────────────────────┤
│ [+ Nuevo Gasto]                │
├────────────────────────────────┤
│ Tabla/Lista de gastos          │
│                                │
│ ID | Desc | Cat | Monto | +--- │
│ 1  | ...  | ... | ...   | ⋯⋯⋯  │
│ 2  | ...  | ... | ...   | ⋯⋯⋯  │
│    |      |     |       |      │
└────────────────────────────────┘
```

### 4. Formulario de Gasto

**Layout Mobile:**
```
┌──────────────────────────┐
│ Nuevo Gasto              │
├──────────────────────────┤
│ Descripción              │
│ [input full-width]       │
│                          │
│ Monto                    │
│ [currency input]         │
│                          │
│ Categoría                │
│ [dropdown/select]        │
│                          │
│ Fecha                    │
│ [date picker]            │
│                          │
│ Método de Pago           │
│ ○ Efectivo  ○ Tarjeta    │
│                          │
│ ¿En cuotas?              │
│ ○ Sí  ○ No               │
│                          │
│ [Si cuotas:]             │
│ Número de cuotas         │
│ [number input]           │
│                          │
│ [Guardar] [Cancelar]     │
└──────────────────────────┘
```

---

## 🎨 ELEMENTOS VISUALES

### Iconos

- **Tamaño estándar**: 24px x 24px
- **Tamaño pequeño**: 16px x 16px
- **Color**: Heredar del texto (#1F2937 por defecto)
- **Librería recomendada**: React Icons (Feather o Font Awesome)

### Indicadores

```
Cargando:
  - Spinner SVG animado
  - Opcional: "Cargando..." texto
  
Vacío:
  - Icono grande (48x48)
  - Texto explicativo
  - Botón de acción

Error:
  - Icono de error (rojo)
  - Mensaje de error rojo
  - Opción de reintentar

Éxito:
  - Icono de checkmark (verde)
  - Mensaje de confirmación
```

### Animaciones (Minimalistas)

```
Transiciones:
- Duración: 200ms - 300ms máximo
- Easing: ease-in-out

Usos:
- Cambio de color en hover: 200ms
- Appear/disappear: 300ms
- Expand/collapse: 200ms

Evitar:
- Animaciones de entrada complejas
- Múltiples animaciones simultáneas
- Transiciones mayores a 300ms
```

---

## ♿ ACCESIBILIDAD

### Requerimientos Mínimos (WCAG 2.1 AA)

- **Color contrast**: 4.5:1 para texto, 3:1 para gráficos
- **Focus visible**: Outline de 2px en tabs
- **Labels**: Todo input debe tener label asociado
- **Alt text**: Todas las imágenes
- **Keyboard nav**: Todos los elementos clickables
- **Font size**: Mínimo 14px
- **Touch targets**: Mínimo 44x44px en mobile

### Implementación

```html
<!-- Labels asociados -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- Focus visible -->
input:focus {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

<!-- ARIA cuando sea necesario -->
<button aria-label="Cerrar modal">×</button>

<!-- Skip to content -->
<a href="#main-content" class="sr-only">
  Ir al contenido principal
</a>
```

---

## 🚀 PERFORMANCE

### Requisitos

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.8s

### Optimizaciones

```
Imágenes:
- Usar Next.js Image o compresión
- Formatos: WebP con fallback JPG
- Responsive: srcset con breakpoints

Código:
- Code splitting por ruta
- Lazy load componentes no críticos
- Tree-shaking de dependencias

Caching:
- Cache-Control: max-age=31536000 (assets)
- Cache-Control: max-age=3600 (HTML)
```

---

## 🌙 DARK MODE (Opcional Futuro)

Si se implementa dark mode, usar:

```
Colores Dark:
- Fondo principal: #111827
- Fondo secundario: #1F2937
- Texto principal: #F9FAFB
- Texto secundario: #D1D5DB
- Bordes: #374151
- Primario: #60A5FA (azul más claro)
```

---

## 📋 COMPONENTES POR PÁGINA

### Dashboard
- 4 Summary Cards (Gasto Total, Categoría Mayor, etc.)
- 2 Charts (Pie chart categorías, Line chart evolución)
- Tabla/Lista Cuotas próximas
- Botones: [Nuevo Gasto], [Ver Todo]

### Listado Gastos
- Filtros desplegables (Fecha, Categoría, Monto)
- Tabla responsiva
- Acciones por fila: Editar, Eliminar
- Paginación
- Botón: [+ Nuevo Gasto]

### Formulario Gasto
- Inputs: Descripción, Monto, Fecha
- Selects: Categoría, Método Pago
- Radio: ¿En cuotas?
- Condicional: Campo número de cuotas
- Botones: Guardar, Cancelar

### Cuotas
- Tabla: Número, Monto, Vencimiento, Estado
- Acciones: Marcar pagada, Eliminar
- Filtro: Mostrar todas / Solo pendientes
- Botón: [+ Nueva cuota]

### Reportes
- Fecha range picker
- Charts: Pie, Line, Bar
- Opciones: Exportar PDF, Descargar CSV
- Resumen: Texto con estadísticas clave

### Perfil
- Avatar (circular, 64x64px)
- Campos: Nombre, Email
- Botón: Cambiar contraseña
- Botón: Logout

---

## 🎯 GUÍA RÁPIDA PARA DESARROLLADOR

### Colores CSS

```css
:root {
  --color-primary: #1F2937;
  --color-secondary: #3B82F6;
  --color-neutral: #E5E7EB;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
}
```

### Tailwind Config

```javascript
module.exports = {
  theme: {
    colors: {
      primary: '#1F2937',
      secondary: '#3B82F6',
      neutral: '#E5E7EB',
    },
    spacing: {
      'xs': '8px',
      'sm': '12px',
      'md': '16px',
      'lg': '20px',
      'xl': '24px',
    },
    borderRadius: {
      'sm': '4px',
      'md': '6px',
      'lg': '8px',
      'full': '9999px',
    },
  }
}
```

### Estructura Base

```jsx
export function App() {
  return (
    <div className="flex h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Contenido */}
          </div>
        </main>
      </div>
    </div>
  )
}
```

---

**Esta especificación garantiza un UI minimalista, consistente y completamente responsive en todos los dispositivos.**
