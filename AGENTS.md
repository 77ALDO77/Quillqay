# Quillqay - AI Agent Instructions

## Running Locally

**Frontend** (Next.js on port 3000):
```bash
cd frontend && bun run dev
```

**Backend** (C# / ASP.NET):
```bash
# TODO: document backend run command
```

**Env vars**:
- Frontend: `NEXT_PUBLIC_API_URL` (defaults to `/api/v1`)

## Stack

- **Package manager**: bun (do NOT use npm/yarn)
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 + Editor.js + TanStack Query + lucide-react (v0.563)
- **Backend**: C# / ASP.NET (replacing previous Rust/Axum implementation)
- **Icons**: lucide-react only — no Google Material Icons, no third-party icon libs
- **Design**: Liquid Glass system defined in `DESIGN.md`, auto-loaded via `opencode.json` `instructions`
- **PWA**: `next-pwa` configured in `next.config.mjs`, generates service worker

## Key Architectural Facts

- **Tailwind v4**: Uses `@import "tailwindcss"` + `@theme inline` in `globals.css`. No `tailwind.config.js`. Custom colors defined as CSS custom properties in `@theme inline` block.
- **Body background**: `#131315` (matches gradient base). Theme color meta tag is `#131315`. Do NOT set `#000000`.
- **All components are `'use client'`** — no React Server Components used (except root `layout.tsx`).
- **Demo data**: Project list, notes, documents, and kanban are hardcoded demo data. They don't call the real API yet.
- **Typecheck**: No standalone `tsc` script in `package.json`. Use `tsc --noEmit` or rely on `next build`.
- **API proxy**: `next.config.mjs` proxies `/api` to backend. Check the `rewrites` config when wiring up the new ASP.NET backend.

## Path Aliases

- Frontend: `@/*` → `./src/*` (tsconfig `paths`)

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
- Need `// @ts-ignore` on imports due to lack of TS declarations

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
| Frontend build | `bun run build` (alias: `next build`) | `frontend/` |
| Frontend lint | `bun run lint` (alias: `eslint`) | `frontend/` |
| Frontend typecheck | `bun tsc --noEmit` | `frontend/` |
