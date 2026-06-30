---
name: excalidraw
description: Integrate @excalidraw/excalidraw in Next.js — dynamic import, theme customization, CSS variable overrides, and SSR constraints.
---

## Installation

`@excalidraw/excalidraw` is installed (v0.18.x). There are peer dep warnings with React 19 but the component works.

## Dynamic Import (REQUIRED)

Excalidraw uses browser APIs (canvas, localStorage). Always use dynamic import with SSR disabled:

```tsx
import dynamic from 'next/dynamic';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);
```

## CSS Import

The separate CSS import is REQUIRED:

```tsx
import '@excalidraw/excalidraw/index.css';
```

Without this, Excalidraw renders with no styling (plain HTML).

## Theme Customization

Excalidraw uses CSS custom properties scoped to `.excalidraw` (light) and `.excalidraw.theme--dark` (dark). Override them with an injected `<style>` tag:

```tsx
<>
  <style>{`
.excalidraw.theme--dark {
  --default-bg-color: #131315;
  --island-bg-color: #1c1b1d;
  --color-primary: #d6baff;
  --color-on-surface: #e5e1e4;
  /* ... other variables from theme.scss */
}
  `}</style>
  <Excalidraw theme="dark" />
</>
```

The style tag must target `.excalidraw.theme--dark` with the same specificity as Excalidraw's own CSS. Since the injected style loads after the Excalidraw CSS, overrides win.

### Key CSS Variables to Override

| Variable | Excalidraw dark default | Description |
|----------|------------------------|-------------|
| `--default-bg-color` | `#121212` | Canvas background |
| `--island-bg-color` | `#232329` | Toolbar/panel background |
| `--color-primary` | `#a8a5ff` | Primary accent |
| `--color-surface-high/low/mid/lowest` | various | Surface hierarchy |
| `--color-on-surface` | `#e3e3e8` | Text color |
| `--input-bg-color` | `#121212` | Input background |
| `--button-gray-1/2/3` | various | Button backgrounds |
| `--color-danger` | `#ffa8a5` | Danger color |

## Props

| Prop | Type | Description |
|------|------|-------------|
| `theme` | `"light" \| "dark"` | Theme mode |
| `viewModeEnabled` | `boolean` | Hide edit tools |
| `zenModeEnabled` | `boolean` | Minimal UI (no toolbar) |
| `UIOptions` | `object` | Hide specific UI elements |

### UIOptions

```tsx
UIOptions={{
  canvasActions: {
    export: false,
    loadScene: false,
    saveToActiveFile: false,
  },
}}
```

## Theming Engine

Excalidraw applies dark theme by toggling the `.theme--dark` class on the `.excalidraw` root element via `classList.toggle()` in `componentDidUpdate`. The class is NOT present in the initial SSR render — it's added after mount on the client.

This means CSS variable overrides targeting `.excalidraw.theme--dark` will apply AFTER the class is toggled on.

## Container Sizing

The Excalidraw container MUST have explicit width and height. Use `h-full w-full` on the wrapper, and ensure the parent chain provides definite dimensions.

## Known Issues

- Peer dep warnings with React 19 (`@excalidraw/excalidraw@0.18.x` expects React 18)
- Canvas flashes light theme before dark class is applied on first render
- Excalidraw's own CSS may conflict with Tailwind reset — override specific classes as needed
