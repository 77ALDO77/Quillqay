# Quillqay - AI Agent Instructions

## Stack

- **Package manager**: bun (do NOT use npm/yarn)
- **Frontend**: React 19 + Vite 6 + React Router 7 + Tailwind CSS 4 + Editor.js + TanStack Query + lucide-react (v0.563)
- **Backend**: Rust (Axum 0.7 + SQLx 0.7 + Postgres)
- **Icons**: lucide-react only — no Google Material Icons, no third-party icon libs
- **Design**: Liquid Glass system defined in `DESIGN.md`

## Running Locally

**Frontend** (Vite SPA):
```bash
cd frontend && bun run dev
```

**Backend** (Rust):
```bash
cd backend && cargo run
```
Requires `DATABASE_URL` env var (see `backend/.env.example`) and a Postgres instance.

**Local dev port**: Frontend dev server runs on port 3001 (configured in `vite.config.ts`), backend runs on port 3000. The `vite.config.ts` dev server proxies `/api` and `/ws` to `http://127.0.0.1:3000`.

**Env vars**:
- Frontend: `VITE_API_URL` (defaults to `/api/v1`) — see `frontend/src/lib/api.ts`
- Backend: `DATABASE_URL` — see `backend/.env.example`

## Key Architectural Facts

- **Tailwind v4**: Uses `@import "tailwindcss"` + `@theme inline` in `index.css` via `@tailwindcss/vite`.
- **Body background**: `#131315` (matches gradient base). Theme color meta tag is `#131315`. Do NOT set `#000000`.
- **Fonts**: Inter + Space Grotesk loaded in `index.html` from Google Fonts CDN. CSS variables `--font-inter` and `--font-space-grotesk`.
- **Routing**: React Router (`react-router-dom`). Root is `App.tsx` and entry point is `main.tsx`.
- **Demo data**: Notes, documents, kanban, diagrams are hardcoded demo data. Frontend does NOT call the real API yet.
- **Typecheck**: `bun tsc --noEmit` or `bun run build` from `frontend/`.
- **API proxy**: `vite.config.ts` proxies `/api` and `/ws` to backend.

## Path Aliases

- Frontend: `@/*` → `./src/*` (tsconfig `paths` + `vite.config.ts` alias)

## Backend (Rust / Axum)

- **Framework**: Axum 0.7 + SQLx 0.7 + PostgreSQL
- **Port**: `0.0.0.0:3000`
- **Health check**: `GET /health`
- **API prefix**: Routes at `/api/v1/` — e.g. `GET /api/v1/pages`, `GET/PUT /api/v1/pages/:id`
- **WebSocket**: `GET /ws`
- **Database**: SQLx with Postgres. Migrations are SQL files in `backend/migrations/`, run via `sqlx migrate run`
- **Offline builds**: `sqlx-data.json` checked in for Docker builds (`SQLX_OFFLINE=true`)
- **Build**: `cargo build --release` produces binary `qillqay-backend`
- **CI**: GitHub Actions builds + pushes Docker image to `ghcr.io` on pushes/PRs touching `backend/**`
- **K8s**: Configs in `k8s/` — backend deployment (2 replicas), Postgres StatefulSet, Cloudflare tunnel, secrets

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (marketing) |
| `/login` | Login page (Google, GitHub, Email — UI only, no backend auth) |
| `/projects` | Project list (clean, no sidebar) |
| `/projects/[id]` | Redirects to `/projects/[id]/notes` |
| `/projects/[id]/notes` | Project notes (post-it cards) — default section |
| `/projects/[id]/documents` | Project documents (Editor.js list + editor) |
| `/projects/[id]/documents/[docId]` | Document editor (full page, inherits sidebar) |
| `/projects/[id]/diagrams` | Diagrams hub (DB, Architecture, Flowchart, Whiteboard) |
| `/projects/[id]/canvas` | Kanban board (drag & drop, priorities) |

## Layout Architecture

```
projects/[id]/
├── layout.tsx       ← Persistent: sidebar (floating island) + navbar (floating island)
└── */page.tsx       ← Just renders a section component (NO wrapper needed)

Components:
  SectionShell.tsx   ← Glass panel + header (title, desc, action button, fullBleed prop)
  EmptyState.tsx      ← Consistent empty state (icon + text + CTA)
  ViewTransitionLink  ← Smooth page transitions (wraps router.push in startViewTransition)
```

**Rule**: Add new project sections by creating `projects/[id]/{section}/page.tsx` that renders `<SectionShell><YourContent /></SectionShell>`. The layout handles sidebar + navbar automatically. Use `fullBleed` prop for full-width layouts (e.g. Kanban).

## Editor.js

- Dynamic import with `ssr: false` in `BlockEditor.tsx`
- Registered tools: `@editorjs/header`, `@editorjs/list`, `@editorjs/checklist`, `@editorjs/code`
- Auto-save in `documents/[docId]/page.tsx` uses a 1000ms timeout (demo-only, not wired to API)
- Module declarations in `src/types/editorjs.d.ts` for editorjs tool packages that lack TS types

## Adding Features

**New Editor.js tool**:
1. `bun add @editorjs/tool-name` (from `frontend/`)
2. Import in `BlockEditor.tsx`
3. Add to `tools` config object

**New project section**:
1. Create component in `frontend/src/components/projects/`
2. Wrap with `<SectionShell title="..." description="..." actionLabel="..." onAction={...}>`
3. Create page at `frontend/src/app/projects/[id]/{section}/page.tsx`

## Required Commands

| Task | Command | Directory |
|------|---------|-----------|
| Frontend dev | `bun run dev` | `frontend/` |
| Frontend build | `bun run build` | `frontend/` |
| Frontend lint | `bun run lint` | `frontend/` |
| Frontend typecheck | `bun tsc --noEmit` | `frontend/` |
| Backend dev | `cargo run` | `backend/` |
| Backend build | `cargo build --release` | `backend/` |
