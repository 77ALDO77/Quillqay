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

Autenticacion, proyectos y documentos ya cuentan con API persistente. Los
metadatos y versiones viven en PostgreSQL; el contenido Editor.js se almacena
como JSON privado e inmutable en MinIO. El listado y editor de documentos ya
consumen esta API con autosave y control optimista de versiones. Notas, kanban
y diagramas conservan datos demo/locales mientras se implementan sus fases.

## Stack

Frontend:

- React 19
- Vite 6
- React Router 7
- Tailwind CSS 4
- Editor.js
- React Flow (@xyflow/react)
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
- Docker Compose para PostgreSQL, MinIO y backend
- Kubernetes manifests en `k8s/`

## Estructura del repositorio

```text
.
|-- backend/     # API Rust con Axum, SQLx y PostgreSQL
|-- frontend/    # SPA React 19 + Vite 6 con la interfaz de Quillqay
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
| `/projects/:id/notes` | Notas del proyecto |
| `/projects/:id/documents` | Documentos del proyecto |
| `/projects/:id/documents/:docId` | Editor de documento |
| `/projects/:id/diagrams` | Hub de diagramas |
| `/projects/:id/diagrams/db/:diagramId` | Editor de esquema DB |
| `/projects/:id/canvas` | Kanban del proyecto |

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
http://localhost:3001
```

(Configurado con proxy hacia el backend en `http://127.0.0.1:3000` para `/api` y `/ws`).

### Backend

La forma recomendada de levantar la infraestructura local es Docker Compose:

```bash
cp .env.example .env
docker compose up --build -d
```

Esto inicia:

- PostgreSQL en `localhost:5433`.
- MinIO en `localhost:9000` y su consola en `localhost:9001`.
- El backend en `localhost:3000`.
- Migraciones y bootstrap idempotente del administrador antes del backend.

Las credenciales incluidas son solo para desarrollo. Cambia `POSTGRES_PASSWORD`,
`MINIO_ROOT_PASSWORD` y `ADMIN_PASSWORD` en `.env` para cualquier entorno compartido.

Para ejecutar el backend fuera de Docker, copia `backend/.env.example` a
`backend/.env`, mantén PostgreSQL y MinIO activos y ejecuta:

```bash
cd backend
cargo run -- migrate
cargo run -- bootstrap-admin
cargo run
```

La API disponible actualmente incluye:

- `GET /health` para liveness sin dependencias.
- `GET /ready` para readiness de PostgreSQL y MinIO.
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET/POST /api/v1/projects`
- `GET/PATCH/DELETE /api/v1/projects/:project_id`
- `POST /api/v1/projects/:project_id/restore`
- `GET/POST /api/v1/projects/:project_id/documents`
- `GET/PATCH/DELETE /api/v1/projects/:project_id/documents/:document_id`
- `PUT /api/v1/projects/:project_id/documents/:document_id/content`
- `POST /api/v1/projects/:project_id/documents/:document_id/restore`
- `GET /api/v1/projects/:project_id/documents/:document_id/revisions`
- `GET /api/v1/projects/:project_id/documents/:document_id/revisions/:revision_id`
- `POST /api/v1/projects/:project_id/documents/:document_id/revisions/:revision_id/restore`

Las rutas de proyectos requieren la cookie creada por login. Las solicitudes
que modifican datos también deben enviar un encabezado `Origin` que coincida
con `ALLOWED_ORIGIN`.

Para comprobar manualmente escritura, lectura y borrado en MinIO:

```bash
docker compose run --rm backend ./qillqay-backend storage-smoke-test
```

Los objetos que quedan huerfanos tras un conflicto o fallo de PostgreSQL se
registran en `storage_cleanup_jobs`. El backend procesa la cola cada minuto;
tambien puede ejecutarse una pasada manual:

```bash
docker compose run --rm backend ./qillqay-backend cleanup-storage
```

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
cargo test
```

## Variables de entorno

Frontend:

```bash
VITE_API_URL=/api/v1
```

Backend:

```bash
cp backend/.env.example backend/.env
```

La referencia completa de variables y valores locales está en
`backend/.env.example`.

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
