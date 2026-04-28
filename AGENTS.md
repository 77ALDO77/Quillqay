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

> **Port mismatch**: `next.config.mjs` proxies `/api` to port 8080, but backend runs on 3000 in `main.rs`. If you get 502 errors, check this rewrite rule - either run backend on 8080 or update the rewrite.

## Key Architectural Facts

- **Stack**: Rust (Axum, SQLx, PostgreSQL) + Next.js 16 (React 19, Editor.js, TanStack Query)
- **Database**: PostgreSQL with `uuid` IDs. Blocks stored as JSONB in `blocks` table.
- **No delete endpoint**: Only create, read, update are implemented.
- **WebSocket**: `/ws` route exists but real-time sync is incomplete.

## Domain Model

```
Page { id: UUID, title: String, parent_id: Option<UUID> }
Block { id: String, type: "header"|"paragraph"|"list"|"checklist"|"code", data: JSON }
```

API: Pages at `/api/v1/pages`, PUT accepts `{ title, blocks: [...] }`.

## Editor.js Setup

- Dynamic import required (SSR disabled) - see `BlockEditor.tsx`
- Auto-save debounced at 2000ms

## Adding Features

**New Editor.js tool**:
1. `npm install @editorjs/tool-name`
2. Import in `BlockEditor.tsx`
3. Add to `tools` config object

**New API endpoint**:
1. Define request struct in `handlers.rs`
2. Add handler in `handlers.rs`
3. Register route in `main.rs`
4. Add repository method in `postgres.rs`
5. Run `cargo sqlx prepare` to update `sqlx-data.json`

## Required Commands

| Task | Command |
|------|---------|
| Backend check | `cargo check` |
| Frontend lint | `npm run lint` (from frontend/) |
| Frontend build | `npm run build` (from frontend/) |
| Database migrate | `cargo sqlx migrate run` |

## Tech Versions

| Package | Version |
|---------|---------|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| Editor.js | 2.31.1 |
| Axum | 0.7 |
| SQLx | 0.7 |