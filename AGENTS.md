# Quillqay - AI Agent Instructions

## Stack

- **Package manager**: bun (do NOT use npm/yarn)
- **Frontend**: React 19 + Vite 6 + React Router 7 + Tailwind CSS 4 + Editor.js + TanStack Query + lucide-react (v0.563)
- **Backend**: Rust (Axum 0.7 + SQLx 0.7 + PostgreSQL + S3/MinIO)
- **Icons**: lucide-react only — no Google Material Icons, no third-party icon libs
- **Design**: Liquid Glass system defined in `DESIGN.md`

## Running Locally

**Infrastructure** (PostgreSQL + MinIO via Docker Compose):
```bash
docker compose up -d
```
- PostgreSQL runs on host port **`5433`** (`postgres://quillqay:quillqay_dev_password@localhost:5433/quillqay_db`).
- MinIO runs on port **`9000`** (S3 API) and **`9001`** (Console) with buckets `quillqay-content` and `quillqay-assets`.

**Backend** (Rust / Axum):
```bash
cd backend && cargo run
```
- Migrations: `cargo run -- migrate` (runs SQL migrations in `backend/migrations/`).
- Bootstrap Admin: `cargo run -- bootstrap-admin` (`admin@quillqay.local` / `change-this-development-password`).
- Port: `0.0.0.0:3000`.

**Frontend** (Vite SPA):
```bash
cd frontend && bun run dev
```
- Port: `http://localhost:3001` (proxies `/api` and `/ws` to `http://127.0.0.1:3000`).

## Key Architectural Facts

- **Tailwind v4**: Uses `@import "tailwindcss"` + `@theme inline` in `index.css` via `@tailwindcss/vite`.
- **Body background**: `#131315` (matches gradient base). Theme color meta tag is `#131315`. Do NOT set `#000000`.
- **Fonts**: Inter + Space Grotesk loaded in `index.html` from Google Fonts CDN. CSS variables `--font-inter` and `--font-space-grotesk`.
- **Routing**: React Router (`react-router-dom`). Root is `App.tsx` and entry point is `main.tsx`.
- **Session & Auth**: Backend generates HttpOnly, SameSite=Lax cookie `quillqay_session`. Frontend `api.ts` passes `credentials: 'include'`.
- **Persistence Status**:
  - **Auth**: 100% real (PostgreSQL + Argon2 + Sessions).
  - **Projects**: 100% real (PostgreSQL + TanStack Query).
  - **Documents**: 100% real (PostgreSQL + MinIO + Autosave + Versioning).
  - **Notes**: 100% real (PostgreSQL + TanStack Query + Colors + Pinning).
  - **Kanban / Tasks**: 100% real (PostgreSQL + TanStack Query + Drag & Drop).
  - **Diagrams**: Powered by AntV X6 (Apache 2.0, zero watermarks/attribution) with ER orthogonal routing. Local storage / schemas, canvas decoupler ready for persistence.
- **Typecheck & Lint**: `bun tsc --noEmit`, `bun run lint`, and `bun run build` from `frontend/`.
- **Path Aliases**: Frontend uses `@/*` → `./src/*` (configured in tsconfig and `vite.config.ts`).

## Backend Architecture (Hexagonal / Ports & Adapters)

Organized cleanly into 4 layers:
- **`domain/` (The Core)**:
  - `entities.rs`: Pure models (`User`, `Project`, `Document`, `Note`, `Task`).
  - `repositories.rs`: Outbound ports / traits (`UserRepository`, `ProjectRepository`, `DocumentRepository`, `NoteRepository`, `TaskRepository`).
  - `storage.rs`: Storage port (`ObjectStorage` trait).
  - `errors.rs`: `DomainError` (`NotFound`, `Validation`, `Conflict`, `Unauthorized`, `Storage`).
- **`application/` (Use Cases)**:
  - `auth.rs`: `AuthService`
  - `projects.rs`: `ProjectService`
  - `notes.rs`: `NoteService`
  - `tasks.rs`: `TaskService`
  - `documents.rs`: `DocumentService` (SHA-256 checksums, object key scoping, versioning)
  - `storage_cleanup.rs`: Background cleanup worker
- **`infrastructure/` (Adapters)**:
  - `persistence/postgres.rs`: SQLx PostgreSQL implementation of all repository traits, enforcing user tenancy (`owner_id`).
  - `storage/s3.rs`: MinIO / AWS S3 implementation of `ObjectStorage`.
  - `web/`: Axum handlers and DTOs mapping `DomainError` to `ApiError` (`auth.rs`, `projects.rs`, `notes.rs`, `tasks.rs`, `documents.rs`, `middleware.rs`).
- **`main.rs`**: Composition root wiring dependencies and configuring the Axum router.

### REST API Routes (`/api/v1`)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/v1/auth/login` | POST | Authenticate user & issue session cookie |
| `/api/v1/auth/logout` | POST | Destroy active session |
| `/api/v1/auth/me` | GET | Retrieve authenticated user profile |
| `/api/v1/projects` | GET, POST | List active projects / Create new project |
| `/api/v1/projects/:id` | GET, PATCH, DELETE | Get, update, or soft-delete project |
| `/api/v1/projects/:id/restore` | POST | Restore soft-deleted project |
| `/api/v1/projects/:id/notes` | GET, POST | List notes / Create note |
| `/api/v1/projects/:id/notes/:note_id` | PATCH, DELETE | Update note (text, color, pin) / Delete note |
| `/api/v1/projects/:id/tasks` | GET, POST | List tasks / Create task |
| `/api/v1/projects/:id/tasks/:task_id` | PATCH, DELETE | Move task (status), edit or delete task |
| `/api/v1/projects/:id/documents` | GET, POST | List documents / Create document |
| `/api/v1/projects/:id/documents/:doc_id` | GET, PATCH, DELETE | Document details, rename, or soft delete |
| `/api/v1/projects/:id/documents/:doc_id/content` | PUT | Autosave Editor.js JSON content to MinIO |
| `/api/v1/projects/:id/documents/:doc_id/revisions` | GET | Document version history |
| `/ws` | GET | WebSocket broadcast connection |

## Frontend Architecture (Feature-Driven / Screaming Architecture)

Frontend domain modules reside in `frontend/src/features/`:

```text
frontend/src/features/
├── db-diagram/               # Database Schema Designer (ERD via AntV X6 - Apache 2.0)
│   ├── core/                 # Pure domain: types.ts, schema-parser.ts, dbml-language.ts, sql-export.ts
│   ├── store/                # schema-context.tsx, diagram-layout-context.tsx, storage-context.tsx
│   ├── components/           # DbSchemaEditor.tsx, DbCanvasX6.tsx, DbmlEditor.tsx, DbDiagramSidebar.tsx, nodes/, dialogs/
│   ├── hooks/                # useDiagramPersistence.ts
│   └── index.ts              # Public API barrel export
│
├── notes/                    # Notes (post-it cards, colors, pinning)
│   ├── components/NotesSection.tsx
│   └── index.ts
│
├── kanban/                   # Kanban / Canvas (Drag & Drop, columns, priorities)
│   ├── components/CanvasSection.tsx
│   └── index.ts
│
├── documents/                # Documents (BlockEditor, Editor.js, autosave)
│   ├── components/DocumentsSection.tsx, BlockEditor.tsx
│   └── index.ts
│
├── whiteboard/               # Whiteboard (Excalidraw free drawing)
│   ├── components/WhiteboardEditor.tsx
│   └── index.ts
│
├── flowchart/                # Flowchart (Process flows & logic)
│   ├── components/FlowchartEditor.tsx, FlowchartSidebar.tsx
│   └── index.ts
│
├── auth/                     # Authentication (AuthContext, ProtectedRoute)
│   ├── context/AuthContext.tsx
│   ├── components/ProtectedRoute.tsx
│   └── index.ts
│
└── projects/                 # Global Project Management & Shell Layouts
    ├── components/SectionShell.tsx, EmptyState.tsx, DiagramsHub.tsx
    └── index.ts
```

### Shared UI & Utilities

- `src/components/ui/`: Atomic primitives (`button.tsx`, `dialog.tsx`, `input.tsx`, `scroll-area.tsx`, `tooltip.tsx`, `ViewTransitionLink.tsx`).
- `src/lib/api.ts`: Typed API client for all backend endpoints.
- `src/lib/utils.ts`: Classnames and UI helpers (`cn`).

## Frontend Routes

| Route | Purpose | Protected |
|-------|---------|-----------|
| `/` | Marketing Landing page | No |
| `/login` | Login page (email & password with session cookie) | No |
| `/projects` | Project list & creation modal | Yes |
| `/projects/:id` | Redirects to `/projects/:id/notes` | Yes |
| `/projects/:id/notes` | Project notes (post-it cards) — default section | Yes |
| `/projects/:id/canvas` | Kanban board (drag & drop, priorities) | Yes |
| `/projects/:id/documents` | Project documents list | Yes |
| `/projects/:id/documents/:docId` | Document editor (Editor.js, autosave to MinIO) | Yes |
| `/projects/:id/diagrams` | Diagrams hub (DB, Architecture, Flowchart, Whiteboard) | Yes |
| `/projects/:id/diagrams/db` | Interactive DBML Schema Designer | Yes |
| `/projects/:id/diagrams/flowchart` | Flowchart diagram editor | Yes |
| `/projects/:id/diagrams/whiteboard` | Excalidraw whiteboard editor | Yes |

## Adding Features

**New project section / feature**:
1. Create module in `frontend/src/features/{feature}/`
2. Export public components in `frontend/src/features/{feature}/index.ts`
3. Wrap section content with `<SectionShell>`
4. Create page in `frontend/src/pages/projects/{Section}Page.tsx` and register route in `App.tsx`

## Required Commands

| Task | Command | Directory |
|------|---------|-----------|
| Start infra (Docker) | `docker compose up -d` | Root (`/`) |
| Backend dev | `cargo run` | `backend/` |
| Backend migrations | `cargo run -- migrate` | `backend/` |
| Backend tests | `cargo test` | `backend/` |
| Backend build | `cargo build --release` | `backend/` |
| Frontend dev | `bun run dev` | `frontend/` |
| Frontend build | `bun run build` | `frontend/` |
| Frontend lint | `bun run lint` | `frontend/` |
| Frontend typecheck | `bun tsc --noEmit` | `frontend/` |
| Frontend E2E tests | `bun run test:e2e` | `frontend/` |
