# Portafolio de Proyectos — Innovación y Transformación Digital

## Descripción
App web React (Vite) para gestión de portafolio de proyectos del área de Innovación de Flores El Trigal. Hospedada en GitHub Pages, conectada a SharePoint Lists via Power Automate como backend.

## Stack técnico
- **Frontend:** React 18 + Vite, single-page app, inline styles (no CSS files)
- **Hosting:** GitHub Pages (gratis, estático)
- **Backend:** SharePoint Lists via Power Automate HTTP triggers
- **Fotos:** GitHub CDN — repo `migueltrigal/portfolio-fotos` (público), token via variable de entorno Vite
- **Deploy:** GitHub Actions compila automáticamente en cada push a `main`

## Estructura de archivos
```
src/
  App.jsx      — Componente principal con toda la UI
  api.js       — Power Automate CRUD + subida de fotos a GitHub CDN
  logo.js      — Logo I+D embebido en base64
  main.jsx     — Entry point de React
.env.local     — VITE_GITHUB_TOKEN (gitignoreado, solo desarrollo local)
index.html     — HTML base
vite.config.js — Config Vite con base path /
public/CNAME — Dominio custom innovacion.trigal-digital.com (GitHub Pages)
.github/workflows/deploy.yml — GitHub Actions (inyecta VITE_GITHUB_TOKEN desde secret)
```

## Variable de entorno
- **`VITE_GITHUB_TOKEN`**: token de GitHub con acceso write al repo `migueltrigal/portfolio-fotos`
- En local: crear `.env.local` (ya está en `.gitignore` via `*.local`)
- En CI: agregar como secret en GitHub → Settings → Secrets → `VITE_GITHUB_TOKEN`

## Identidad visual
- **Colores corporativos:** Navy #0E2841 (primario), Teal #267B8A (secundario), Orange #E97132 (acento), Amarillo #FFD40A (título principal)
- **Fuente:** Aptos con fallback a Segoe UI
- **Logo:** I+D embebido como base64 en src/logo.js
- **Estilos:** 100% inline styles, sin archivos CSS. Tokens en el objeto `C` al inicio de App.jsx
- **Título "Portafolio de Proyectos":** Color #FFD40A (amarillo), ubicado en el header principal

## Modelo de datos (SharePoint Lists)

### Proyectos_ITD
| Campo | Tipo SharePoint | Obligatorio |
|-------|----------------|-------------|
| Nombre (Title) | Línea de texto | Sí |
| Descripcion | Varias líneas | No |
| Responsable | Línea de texto | Sí |
| Sede | Línea de texto | No |
| FechaInicio | Fecha | Sí |
| FechaEstimadaFin | Fecha | No |
| Presupuesto | Número | No |
| Estado | Opción: En curso, En riesgo, Pausado, Completado, Cancelado | Sí |
| Fase | Opción: Ideación, Iniciación, Prototipado, Piloto, Implementación, Entrega, Seguimiento | Sí |
| FotoPrincipal | Línea de texto (URL) | No |

### Avances_ITD
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| TituloAvance (Title) | Línea de texto | Sí |
| ProyectoID | Número | Sí |
| Fecha | Fecha | Sí |
| Descripcion | Varias líneas | No |
| ProximoPaso | Varias líneas | Sí |
| RegistradoPor | Línea de texto | Sí |
| FotoEvidencia | Línea de texto (URL) | No |

### Contratos_ITD
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| Proveedor (Title) | Línea de texto | Sí |
| ProyectoID | Número | Sí |
| Concepto | Línea de texto | Sí |
| Valor | Número | Sí |

### Pagos_ITD
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| Nota (Title) | Línea de texto | No |
| ContratoID | Número | Sí |
| Fecha | Fecha | Sí |
| Monto | Número | Sí |

## Power Automate Endpoints (en src/api.js)
- **API-Leer** (GET): Trae las 4 listas completas en un solo JSON. Debe incluir los campos `Sede`, `FotoPrincipal` en proyectos y `FotoEvidencia` en avances. **No requiere modificaciones cuando se agregan columnas nuevas a las listas de SharePoint** — el paso "Obtener elementos" trae todas las columnas automáticamente.
- **API-CrearProyecto** (POST): Crea item en Proyectos_ITD. Acepta `sede`, `fotoPrincipal` (opcionales).
- **API-EditarProyecto** (POST): Actualiza item en Proyectos_ITD por ID. Acepta `sede`, `fotoPrincipal` (opcionales).
- **API-CrearAvance** (POST): Crea item en Avances_ITD. Acepta `fotoEvidencia` (opcional).
- **API-CrearContrato** (POST): Crea item en Contratos_ITD
- **API-CrearPago** (POST): Crea item en Pagos_ITD

> Los flujos de escritura devuelven `{"ok": true}`. `apiCall()` maneja esto correctamente (parsea el texto, no depende del body para obtener el ID).

> Los campos opcionales se filtran con `stripEmpty()` antes del POST — nunca se envían como `null`.

## Subida de fotos (GitHub CDN)
- **Función:** `subirFotoGithub(file, folder)` en `api.js`
- **Flujo:** selección de archivo → compresión canvas (max 1200px, ~900KB) → base64 → PUT a GitHub API → URL pública `raw.githubusercontent.com`
- **Carpetas:** `/proyectos/` para foto principal, `/avances/` para foto evidencia
- **Nombres:** `{timestamp}-{slug}.jpg`
- **Repo:** `migueltrigal/portfolio-fotos` (debe ser público para que las imágenes sean accesibles sin autenticación)

## Sistema de roles
- **Lector (default):** Ve todo pero no puede editar. No ve botones de crear/editar.
- **Editor:** Desbloquea con clave `innova2026` via botón "🔑 Acceso editor". Ve todos los controles CRUD.
- Implementado con `AuthCtx` (React Context). El contexto expone `{ isEditor, isMobile }`.

## Responsive / Móvil
- Breakpoint: `≤640px` via hook `useMediaQuery("(max-width: 640px)")`
- `isMobile` se distribuye a todos los componentes a través de `AuthCtx`
- Cambios en móvil: header en columna, stats 2×2, filtros con scroll horizontal, tarjetas en 1 columna, formularios en 1 columna, foto principal ancho completo encima del texto, pagos apilados

## Notas importantes
- SharePoint devuelve campos de opción (Estado, Fase) como objetos: `{Value: "En curso"}` — el mapeo en `loadAll()` ya maneja esto con `p.Estado?.Value || p.Estado`
- El campo Title de SharePoint se renombró en cada lista (Nombre, TituloAvance, Proveedor, Nota) pero la API de SharePoint sigue usando `Title` internamente
- Power Automate tiene ~5 segundos de latencia por llamada — la app muestra "Guardando..." durante las operaciones
- El `Obtener elementos` de SharePoint tiene límite default de 100 items. Si se superan 100 proyectos/avances, hay que configurar paginación en el flujo.

## Comandos
```bash
npm install    # Instalar dependencias
npm run dev    # Servidor local de desarrollo (requiere .env.local con VITE_GITHUB_TOKEN)
npm run build  # Compilar para producción (genera dist/)
```

## Deploy
Push a `main` → GitHub Actions compila y despliega automáticamente a:
https://innovacion.trigal-digital.com/ (dominio custom vía GitHub Pages)
