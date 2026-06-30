---
name: tanstack-query
description: Work with @tanstack/react-query v5 — hooks, mutations, query invalidation, and patterns used in this project.
---

## Version & Setup

`@tanstack/react-query@^5.90.20` is installed. The `QueryProvider` wraps the root layout:

```tsx
// src/providers/QueryProvider.tsx
export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 }, // 1 minute
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

## Current State

TanStack Query is **installed and configured** (`QueryProvider` in root layout), but **not yet used** in any component. The frontend currently uses hardcoded demo data. When connecting to the real API, follow the patterns below.

## Data Flow Pattern

```
api.ts  →  hooks/useX.ts  →  component
(fetch)    (useQuery/useMutation)    (data + loading + error)
```

## Hook Pattern

Create hooks per resource in `src/hooks/`:

```tsx
// src/hooks/usePages.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPages, createPage, updatePage, type Page } from '@/lib/api';

export function usePages() {
  return useQuery({
    queryKey: ['pages'],
    queryFn: fetchPages,
  });
}

export function usePage(id: string) {
  return useQuery({
    queryKey: ['pages', id],
    queryFn: () => getPage(id),
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => createPage(title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pages'] }),
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, blocks }: { id: string; title: string; blocks: Block[] }) =>
      updatePage(id, title, blocks),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['pages', id] });
    },
  });
}
```

## Key v5 Differences from v4

| v4 | v5 |
|----|----|
| `useQuery('key', fn)` | `useQuery({ queryKey, queryFn })` |
| `useMutation(fn)` | `useMutation({ mutationFn })` |
| `onSuccess` in options | Still supported |
| `keepPreviousData` | `placeholderData: keepPreviousData` (import from lib) |
| `queryCache.onError` | `meta` field for error handling |

## Stale Time

Default `staleTime: 60 * 1000` (1 minute). Adjust per-query:

```tsx
useQuery({ queryKey: ['pages'], queryFn: fetchPages, staleTime: 5 * 60 * 1000 });
```

## Error Handling

```tsx
const { data, isLoading, error } = usePages();
if (error) return <ErrorState message={(error as Error).message} />;
if (isLoading) return <LoadingSkeleton />;
return <DataView data={data} />;
```

## Optimization

- Use `select` to derive data: `useQuery({ ..., select: (data) => data.filter(...) })`
- Use `enabled` for dependent queries: `useQuery({ ..., enabled: !!userId })`
- Use `keepPreviousData` for paginated lists
