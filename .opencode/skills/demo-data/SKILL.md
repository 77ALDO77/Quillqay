---
name: demo-data
description: Add or modify hardcoded demo/mock data in the frontend. Covers where demo data lives, how it's structured, and how the API client relates.
---

## Current State

The frontend uses **hardcoded demo data** everywhere. The Rust backend has a real API but the frontend does NOT call it yet. When adding features, use demo data arrays — don't try to wire up the backend API unless explicitly asked.

## Where Demo Data Lives

Demo data is defined as `const` arrays inside each section's component file:

| Section | Component file |
|---------|---------------|
| Notes (post-its) | Component in `frontend/src/components/projects/` |
| Documents list | `frontend/src/components/projects/` |
| Kanban board | `frontend/src/components/projects/` |
| Diagrams hub | `frontend/src/components/projects/DiagramsHub.tsx` |

Look at existing components to follow the pattern.

## Demo Data Pattern

```tsx
'use client';

const demoItems = [
  {
    id: '1',
    title: 'Example Item',
    description: 'Some description text',
    // ...other fields specific to the section
  },
  {
    id: '2',
    title: 'Another Item',
    description: 'More text',
  },
];

export default function MySection() {
  const [items] = useState(demoItems);
  // ...
}
```

## API Client (for future use)

The API client exists at `frontend/src/lib/api.ts` with these ready-to-use functions:

| Function | Method | Endpoint |
|----------|--------|----------|
| `fetchPages()` | GET | `/api/v1/pages` |
| `getPage(id)` | GET | `/api/v1/pages/:id` |
| `createPage(title)` | POST | `/api/v1/pages` |
| `updatePage(id, title, blocks)` | PUT | `/api/v1/pages/:id` |

The base URL comes from `NEXT_PUBLIC_API_URL` (defaults to `/api/v1`).

## Data Types

```ts
interface Page {
  id: string;
  title: string;
  content?: string;
  blocks?: Block[];
  updated_at?: string;
}

interface Block {
  id: string;
  type: 'header' | 'paragraph' | 'list' | 'checklist' | 'code';
  data: any;
}
```

## ID Generation

The project doesn't have a UUID library installed. For demo data, either:
- Hardcode string IDs: `'1'`, `'2'`, `'3'`
- Use `crypto.randomUUID()` (built-in browser API, works in 'use client' components)

## Demos by Section

- **Notes**: Post-it style cards with title, content preview, color accent, timestamp
- **Documents**: List of Editor.js documents with title and last-modified date
- **Kanban**: Columns (Todo, In Progress, Done) with draggable cards, priority tags
- **Diagrams**: Hub with 4 diagram types (DB, Architecture, Flowchart, Whiteboard)
