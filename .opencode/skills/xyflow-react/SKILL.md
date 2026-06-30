---
name: xyflow-react
description: Work with @xyflow/react (React Flow v12) — custom nodes, edges, handles, hooks, and integration patterns used in the project.
---

## Version

`@xyflow/react@12.x` (installed). The API changed significantly from v11 — do NOT use old `reactflow` package.

## Imports

```tsx
import {
  ReactFlow, Handle, Position, Background, Controls, // Components
  MarkerType, BackgroundVariant,                      // Enums
  useNodesState, useEdgesState, useReactFlow,         // Hooks
  useOnViewportChange,                                // Viewport tracking (added in v12)
  ReactFlowProvider,                                  // Context provider
  addEdge,                                            // Utility
  type Node, type Edge, type NodeProps,               // Types
} from '@xyflow/react';
```

## CSS

Import the base styles: `import '@xyflow/react/dist/style.css'`. The `style.css` includes dark mode support via `colorMode="dark"` prop. `base.css` is minimal — use `style.css` instead.

## Key Patterns

### Custom Nodes

```tsx
type MyNode = Node<MyData, 'myType'>;

function MyNode({ data }: NodeProps<MyNode>) {
  return <div>{data.label}</div>;
}

const nodeTypes = { myType: MyNode }; // MUST be stable reference (memoized or module-level)
```

- Register `nodeTypes` on the `<ReactFlow>` component
- The object MUST be stable — define at module level or wrap in `useMemo`
- Node types use `type` field in `Node` generic (second param)

### Handles per Row

Position handles at specific row offsets using `style={{ top }}`:

```tsx
<Handle type="target" position={Position.Left} style={{ top: rowOffset }} />
<Handle type="source" position={Position.Right} style={{ top: rowOffset }} />
```

- Each handle should have a unique `id` for edge connections
- Use custom colors that match the node theme

### Edges with Markers

```tsx
{
  id: 'e1',
  source: 'node-1',
  sourceHandle: 'col-fk-source',
  target: 'node-2',
  targetHandle: 'col-pk-target',
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#d6baff', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#d6baff' },
  label: 'column_name',
  labelStyle: { fill: '#cdc2d7', fontSize: 11, fontWeight: 600 },
}
```

### Viewport Tracking

```tsx
useOnViewportChange({
  onChange: ({ zoom }) => setZoomLevel(`${Math.round(zoom * 100)}%`),
});
```

### Custom Toolbar (instead of Controls)

Replace `<Controls>` with a custom toolbar using `useReactFlow()`:

```tsx
const { zoomIn, zoomOut, fitView } = useReactFlow();
// zoomIn({ duration: 200 }), zoomOut(...), fitView({ duration: 300, padding: 0.15 })
```

### Context Menu

Use `onPaneContextMenu` (NOT `onContextMenu` — that prop doesn't exist):

```tsx
<ReactFlow
  onPaneContextMenu={(e) => { e.preventDefault(); /* use e.clientX/Y */ }}
  onNodeContextMenu={(e, node) => { e.preventDefault(); /* use e.clientX/Y */ }}
/>
```

### Drag & Drop (palette to canvas)

```tsx
const onDrop = useCallback((event: DragEvent) => {
  const type = event.dataTransfer.getData('application/reactflow');
  const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
  // add node at position
}, [reactFlowInstance]);
```

- Palette items set `event.dataTransfer.setData('application/reactflow', nodeType)` in `onDragStart`
- `screenToFlowPosition` converts viewport → flow coordinates (accounts for zoom/pan)

## Provider Requirement

`<ReactFlowProvider>` must wrap any component using `useReactFlow()`, `useOnViewportChange`, or `useStore()`. Put it at the top level of your editor component.
