---
name: editorjs
description: Work with Editor.js in the project — dynamic imports, adding tools, block data structures, auto-save, and SSR constraints.
---

## Dynamic Import (REQUIRED)

Editor.js only works in the browser. Always use dynamic import with SSR disabled:

```tsx
import dynamic from 'next/dynamic';

const BlockEditor = dynamic(() => import('@/components/BlockEditor'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-surface-container rounded-3xl" />
});
```

The main editor component is at `frontend/src/components/BlockEditor.tsx`.

## TypeScript Declarations

Editor.js tool packages lack TypeScript declarations. Instead of `@ts-ignore` or `@ts-expect-error` on each import, declare types in `src/types/editorjs.d.ts`:

```ts
declare module '@editorjs/header';
declare module '@editorjs/list';
declare module '@editorjs/checklist';
declare module '@editorjs/code';
```

This file already exists — add new tools there.

## Registered Tools

These tools are installed and configured in `BlockEditor.tsx`:

| Tool | Package | Block type |
|------|---------|------------|
| Header | `@editorjs/header` | `header` |
| List (unordered) | `@editorjs/list` | `list` |
| Checklist | `@editorjs/checklist` | `checklist` |
| Code | `@editorjs/code` | `code` |

## Adding a New Tool

1. **Install**: `bun add @editorjs/tool-name` (from `frontend/`)
2. **Declare**: Add `declare module '@editorjs/tool-name'` in `src/types/editorjs.d.ts`
3. **Import** in `BlockEditor.tsx`
4. **Register** in the `tools` config object inside the EditorJS constructor
5. **Format**: Follow the same pattern as existing tools (inlineToolbar, config placeholders, etc.)

## Block Data Structure

```ts
interface Block {
  id: string;
  type: 'header' | 'paragraph' | 'list' | 'checklist' | 'code';
  data: any;
}

interface EditorJsData {
  time: number;
  blocks: Block[];
  version: string;
}
```

See `frontend/src/lib/api.ts` for full type definitions.

## Auto-Save

The document editor (`documents/[docId]/page.tsx`) has a debounced auto-save with 1000ms timeout. Demo-only — NOT connected to the backend.

## Styles

Editor.js custom styles are in `globals.css` under `.codex-editor` selectors. They fix Tailwind reset conflicts for lists, checklists, headers, and paragraphs. Do NOT override unless there's a specific rendering bug.
