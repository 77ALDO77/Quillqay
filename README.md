# Quillqay

Quillqay es un espacio de trabajo open source para organizar conocimiento, notas, documentos, diagramas y tareas dentro de proyectos. El nombre viene de la idea de escribir y dar forma al pensamiento: capturar ideas sueltas, convertirlas en documentos vivos, diagramar sistemas y ordenar el trabajo en un solo lugar.

El objetivo del proyecto es construir una herramienta local-first y extensible para estudiantes, desarrolladores, equipos pequenos y personas que necesitan pensar con estructura sin depender de una suite cerrada. Quillqay combina una experiencia visual tipo workspace con herramientas productivas como notas rapidas, documentos en bloques, diagramas de base de datos, flujos, pizarras y kanban.

## Que problema busca resolver

Muchas herramientas separan el pensamiento en demasiados lugares: notas en una app, documentacion en otra, diagramas en otra y tareas en otra. Quillqay busca unir esas piezas por proyecto para que el contexto no se pierda.

La meta es que un proyecto pueda contener:

- Notas rapidas para ideas, recordatorios y pendientes.
- Documentos tipo Notion/Markdown para escribir procesos, specs o documentacion.
- Diagramas para bases de datos, arquitectura, flujos y pizarras.
- Canvas kanban para organizar tareas y prioridades.
- Una base futura para sincronizacion, colaboracion y persistencia real mediante API.

## Estado actual

El frontend ya contiene la experiencia principal y usa datos demo/locales para varias secciones. El backend existe como base en Rust para manejar paginas, bloques, API HTTP, WebSocket y persistencia en PostgreSQL, pero el frontend todavia no esta completamente conectado a la API real.

## Stack

Frontend:

- Next.js 16
- React 19
- Tailwind CSS 4
- Editor.js
- React Flow
- Monaco Editor
- Excalidraw
- TanStack Query
- Dexie
- lucide-react
- Bun

Backend:

- Rust
- Axum
- SQLx
- PostgreSQL
- WebSocket

Infraestructura:

- Dockerfile para backend
- Kubernetes manifests en `k8s/`
- Configuracion PWA en el frontend

## Estructura del repositorio

```text
.
|-- backend/     # API Rust con Axum, SQLx y PostgreSQL
|-- frontend/    # App Next.js con la interfaz de Quillqay
|-- k8s/         # Manifiestos Kubernetes
|-- DESIGN.md    # Sistema visual Liquid Glass
`-- AGENTS.md    # Guia tecnica para agentes y colaboradores
```

## Funcionalidades principales

### Proyectos

La vista de proyectos agrupa el trabajo por contexto. Cada proyecto abre un workspace con navegacion persistente.

### Notes

Notas rapidas con tarjetas visuales, busqueda, estados y edicion enfocada en modal.

### Documents

Editor de documentos basado en bloques. La intencion es acercarse a una experiencia tipo Notion/Markdown, donde el titulo del documento es parte de la hoja y el contenido se escribe con comandos de bloque.

### Diagrams

Hub de diagramas y editor de esquemas de base de datos. El editor DB usa React Flow, sidebar colapsable, importacion de schema, exportacion SQL, edicion DBML y conexiones visuales entre tablas.

### Canvas

Tablero kanban para organizar tareas por estado y prioridad.

## Rutas principales

| Ruta | Descripcion |
| --- | --- |
| `/` | Landing page |
| `/login` | Pantalla de login visual |
| `/projects` | Lista de proyectos |
| `/projects/[id]/notes` | Notas del proyecto |
| `/projects/[id]/documents` | Documentos del proyecto |
| `/projects/[id]/documents/[docId]` | Editor de documento |
| `/projects/[id]/diagrams` | Hub de diagramas |
| `/projects/[id]/diagrams/db/[diagramId]` | Editor de esquema DB |
| `/projects/[id]/canvas` | Kanban del proyecto |

## Ejecutar en local

Este proyecto usa Bun para el frontend. No uses npm ni yarn.

### Frontend

```bash
cd frontend
bun install
bun run dev
```

Por defecto estara disponible en:

```text
http://localhost:3000
```

### Backend

El backend requiere una variable `DATABASE_URL` apuntando a PostgreSQL.

```bash
cd backend
cargo run
```

Ejemplo de variable:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/quillqay
```

El backend expone:

- `GET /health`
- `GET /api/v1/pages`
- `POST /api/v1/pages`
- `GET /api/v1/pages/:id`
- `PUT /api/v1/pages/:id`
- `GET /ws`

## Comandos utiles

Frontend:

```bash
cd frontend
bun run dev
bun run build
bun run lint
bun tsc --noEmit
```

Backend:

```bash
cd backend
cargo run
cargo build --release
```

## Variables de entorno

Frontend:

```bash
NEXT_PUBLIC_API_URL=/api/v1
```

Backend:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/quillqay
```

## Diseno

Quillqay usa un sistema visual llamado Liquid Glass, documentado en `DESIGN.md`. La interfaz prioriza superficies oscuras, paneles glass, acentos suaves en morado/cian/rosa y una experiencia de workspace compacta.

## Vision

Quillqay busca convertirse en una herramienta abierta para pensar, escribir y disenar sistemas desde un solo lugar. La vision a futuro incluye:

- Persistencia completa conectada al backend.
- Sincronizacion en tiempo real.
- Colaboracion multiusuario.
- Mas herramientas de diagramacion.
- Editor de documentos mas completo.
- Integracion de IA para resumir, mejorar redaccion y asistir en documentacion tecnica.


