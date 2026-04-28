# Quillqay - AI Agent Instructions

## Running Locally

**Frontend** (Next.js on port 3000):
```bash
cd frontend && bun run dev
```

**Backend** (Rust/Axum on port 3000):
```bash
cd backend && cargo run
```

> **Port mismatch**: `next.config.mjs` proxies `/api` to port 8080, but `main.rs` binds `0.0.0.0:3000`. If you get 502 errors, align them: either run backend on 8080 or update the rewrite.

## Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 + Editor.js + TanStack Query + lucide-react
- **Backend**: Rust (Axum 0.7, SQLx 0.7, PostgreSQL)
- **Icons**: lucide-react v0.563 (no Google Material Icons, no third-party icon libs)
- **Design**: Liquid Glass system defined in `DESIGN.md`, auto-loaded via `opencode.json` `instructions`

## Key Architectural Facts

- **No delete endpoint**: API has create/read/update only. Backend repo has `delete_page()` but no handler exposed.
- **WebSocket**: `/ws` route exists but real-time sync is incomplete (broadcast channel not wired to page updates).
- **Database**: PostgreSQL, UUID IDs. Blocks stored as JSONB in `blocks` table.
- **Tailwind v4**: Uses `@import "tailwindcss"` + `@theme inline` in `globals.css`. No `tailwind.config.js`. Custom colors (primary, surface, etc.) defined as CSS custom properties.
- **Body background**: `#131315` (matches gradient base). Theme color meta tag is `#131315`. Do NOT set `#000000`.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (marketing) |
| `/login` | Login page (Google, GitHub, Email — UI only, no backend auth) |
| `/projects` | Project list (clean, no sidebar) |
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
  SectionShell.tsx   ← Glass panel + header (title, desc, action button)
  EmptyState.tsx      ← Consistent empty state (icon + text + CTA)
  ViewTransitionLink  ← Smooth page transitions (wraps router.push in startViewTransition)
```

**Rule**: Add new project sections by creating `projects/[id]/{section}/page.tsx` that renders `<SectionShell><YourContent /></SectionShell>`. The layout handles sidebar + navbar automatically.

## Editor.js

- Dynamic import with `ssr: false` in `BlockEditor.tsx`
- Auto-save debounced at 2000ms
- Currently registered tools: `@editorjs/header`, `@editorjs/list`, `@editorjs/checklist`, `@editorjs/code`

## Adding Features

**New Editor.js tool**:
1. `bun add @editorjs/tool-name` (from frontend/)
2. Import in `BlockEditor.tsx`
3. Add to `tools` config object

**New API endpoint**:
1. Define request struct in `handlers.rs`
2. Add handler function in `handlers.rs`
3. Register route in `main.rs`
4. Add repository method in `postgres.rs`
5. Run `cargo sqlx prepare` to update `sqlx-data.json`

**New project section**:
1. Create component in `frontend/src/components/projects/`
2. Wrap with `<SectionShell title="..." description="..." actionLabel="..." onAction={...}>`
3. Create page at `frontend/src/app/projects/[id]/{section}/page.tsx`

## Required Commands

| Task | Command |
|------|---------|
| Frontend dev | `cd frontend && bun run dev` |
| Frontend build | `cd frontend && bun run build` (alias for `next build`) |
| Frontend lint | `cd frontend && bun run lint` (alias for `eslint`) |
| Backend check | `cargo check` (from backend/) |
| Database migrate | `cargo sqlx migrate run` (from backend/) |
| Run backend | `cd backend && cargo run` |

## Verified Tech Versions

| Package | Version |
|---------|---------|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| Editor.js | 2.31.1 |
| lucide-react | 0.563 |
| Tailwind CSS | 4 |
| Axum | 0.7 |
| SQLx | 0.7 |