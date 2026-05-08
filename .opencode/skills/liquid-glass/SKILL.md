---
name: liquid-glass
description: Use Tailwind v4 and Liquid Glass design tokens when building UI components, pages, or styling. Covers colors, typography, glass effects, rounded corners, and background patterns.
---

## Core Rules

- **NO `tailwind.config.js`** — Tailwind v4 uses `@import "tailwindcss"` + `@theme inline` in `globals.css`
- **Background**: `bg-[#131315]` — NEVER use `#000000` or `bg-black`
- **Page gradient**: `bg-[radial-gradient(circle_at_top_left,#1c1b1d_0%,#131315_100%)]`
- **Fonts**: `font-sans` = Inter, `font-display` = Space Grotesk, `font-mono` for code

## Color Tokens (available as Tailwind classes)

| Token | Usage |
|-------|-------|
| `primary` / `primary-container` | Main brand color / stronger variant |
| `surface` / `surface-dim` | Card/panel backgrounds |
| `surface-container` through `surface-container-highest` | Elevated layers |
| `surface-container-lowest` | Darkest container, code blocks |
| `on-surface` / `on-surface-variant` | Text on surfaces |
| `on-primary` / `on-primary-container` | Text on primary backgrounds |
| `outline` / `outline-variant` | Borders and dividers |
| `error` / `error-container` | Error states |

## Glass Effects (pre-built CSS classes in globals.css)

- **`.glass-panel`** — Card/container: `bg-white/3`, `backdrop-blur-[20px]`, `border border-white/10`, inset shadow
- **`.glow-accent`** — Add to icons/elements for primary glow: `drop-shadow(0 0 8px rgba(214,186,255,0.4))`
- **`.custom-scrollbar`** — Thin purple scrollbar (4px, primary tint)

## Manual Glass Patterns

When you need borders or effects not covered by `.glass-panel`:

```html
<!-- Luminous border card -->
<div class="rounded-3xl border border-white/10 bg-white/3 backdrop-blur-[20px]">

<!-- Subtle border -->
<div class="rounded-2xl border border-white/5 bg-surface-container-low">

<!-- Button with glow shadow -->
<button class="bg-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 hover:saturate-150">

<!-- Input -->
<input class="bg-surface-container-low border border-white/10 rounded-xl focus:border-primary focus:shadow-[0_0_0_2px_rgba(214,186,255,0.1)]">
```

## Rounded Corners

- Cards/containers → `rounded-3xl` (24px)
- Buttons/inputs → `rounded-xl` (12px)
- Code blocks → `rounded-2xl`

## Editor.js Overrides

Editor.js styles already exist in `globals.css` under `.codex-editor`. Do NOT add competing styles. Existing overrides cover lists, checklists, headers, paragraphs, and checklist colors.
