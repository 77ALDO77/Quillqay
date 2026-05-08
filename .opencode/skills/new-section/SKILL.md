---
name: new-section
description: Add a new project section (e.g. /projects/[id]/wiki) following the project's layout pattern. Covers component creation, SectionShell wrapper, page setup, demo data, and navigation.
---

## Before You Start

The layout at `projects/[id]/layout.tsx` already provides the sidebar (floating island) and navbar (floating island). Your page component is rendered inside that shell — do NOT add another wrapper.

## Step-by-Step

### 1. Create the Component

Create `frontend/src/components/projects/<Name>.tsx`:

```tsx
'use client';

import SectionShell from '@/components/projects/SectionShell';

export default function MySection() {
  return (
    <SectionShell
      title="My Section"
      description="What this section does"
      actionLabel="New Item"
      onAction={() => { /* open modal, navigate, etc. */ }}
    >
      {/* Your content here */}
    </SectionShell>
  );
}
```

**SectionShell props**:
- `title` — Large heading shown at top
- `description` — Subtitle text under the title
- `actionLabel` — Text for the CTA button (right side of header)
- `onAction` — Callback when CTA button is clicked
- `fullBleed` — Set `true` for full-width layouts (e.g. Kanban). Default is `false` (constrained width).

### 2. Create the Page

Create `frontend/src/app/projects/[id]/<section>/page.tsx`:

```tsx
'use client';

import MySection from '@/components/projects/MySection';

export default function MySectionPage() {
  return <MySection />;
}
```

The page is just a thin wrapper. It MUST be `'use client'`. Do NOT add extra layout or navigation elements.

### 3. Navigation (if needed)

To link to your new section from other sections, use `ViewTransitionLink`:

```tsx
import ViewTransitionLink from '@/components/ViewTransitionLink';

<ViewTransitionLink href={`/projects/${id}/mysection`}>
  Go to My Section
</ViewTransitionLink>
```

## Empty State

When the section has no data, use `EmptyState`:

```tsx
import EmptyState from '@/components/projects/EmptyState';
import { FileText } from 'lucide-react'; // lucide-react only

<EmptyState
  icon={<FileText className="w-12 h-12 text-outline-variant" />}
  title="No items yet"
  description="Create your first item to get started."
  actionLabel="New Item"
  onAction={() => {}}
/>
```

## Demo Data Pattern

For hardcoded demo data, define arrays at the top of the component file:

```tsx
const demoItems = [
  { id: '1', title: 'Example', /* ... */ },
  { id: '2', title: 'Another', /* ... */ },
];
```

The API is NOT wired yet — use demo data for now. The API client exists in `frontend/src/lib/api.ts` for future integration.
