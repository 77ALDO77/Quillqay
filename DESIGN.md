# Liquid Glass Design System

## Colors

```yaml
surface: '#131315'
surface-dim: '#131315'
surface-bright: '#39393b'
surface-container-lowest: '#0e0e10'
surface-container-low: '#1c1b1d'
surface-container: '#201f21'
surface-container-high: '#2a2a2c'
surface-container-highest: '#353437'
on-surface: '#e5e1e4'
on-surface-variant: '#cdc2d7'
inverse-surface: '#e5e1e4'
inverse-on-surface: '#313032'
outline: '#968da0'
outline-variant: '#4b4454'
surface-tint: '#d6baff'
primary: '#d6baff'
on-primary: '#420089'
primary-container: '#aa73ff'
on-primary-container: '#3a0079'
inverse-primary: '#7832d9'
secondary: '#d3fbff'
on-secondary: '#00363a'
secondary-container: '#00eefc'
on-secondary-container: '#00686f'
tertiary: '#ffb0cb'
on-tertiary: '#640036'
tertiary-container: '#ff479c'
on-tertiary-container: '#58002f'
error: '#ffb4ab'
on-error: '#690005'
error-container: '#93000a'
on-error-container: '#ffdad6'
primary-fixed: '#ecdcff'
primary-fixed-dim: '#d6baff'
on-primary-fixed: '#280057'
on-primary-fixed-variant: '#5f00c0'
secondary-fixed: '#7df4ff'
secondary-fixed-dim: '#00dbe9'
on-secondary-fixed: '#002022'
on-secondary-fixed-variant: '#004f54'
tertiary-fixed: '#ffd9e3'
tertiary-fixed-dim: '#ffb0cb'
on-tertiary-fixed: '#3e001f'
on-tertiary-fixed-variant: '#8d004f'
background: '#131315'
on-background: '#e5e1e4'
surface-variant: '#353437'
```

## Typography

| Token | Font | Size | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| h1 | Space Grotesk | 48px | 700 | 1.1 | -0.02em |
| h2 | Space Grotesk | 32px | 600 | 1.2 | -0.01em |
| h3 | Space Grotesk | 24px | 600 | 1.3 | - |
| body-lg | Space Grotesk | 18px | 400 | 1.6 | - |
| body-md | Space Grotesk | 16px | 400 | 1.6 | - |
| code | Space Grotesk | 14px | 500 | 1.5 | 0.05em |
| label-caps | Space Grotesk | 12px | 700 | 1.0 | 0.1em |

## Rounded Corners

| Token | Value |
|-------|-------|
| sm | 0.25rem |
| DEFAULT | 0.5rem |
| md | 0.75rem |
| lg | 1rem |
| xl | 1.5rem |
| full | 9999px |

## Spacing

| Token | Value |
|-------|-------|
| unit | 8px |
| container-padding | 32px |
| gutter | 24px |
| glass-padding | 20px |
| section-gap | 64px |

## Elevation & Depth

- **Backdrop Blur**: All glass containers must use `blur(12px)` to `blur(20px)`
- **Surface Gradients**: Subtle linear gradient from top-left (lighter) to bottom-right (darker)
- **Luminous Borders**: 1px borders with linear gradient from `rgba(255,255,255,0.2)` to `rgba(255,255,255,0.05)`
- **Under-glows**: Low-opacity radial gradient of Primary behind glass cards

## Shapes

- **Cards/Containers**: `rounded-3xl` (1.5rem / 24px)
- **Buttons/Inputs**: `rounded-xl` (0.75rem / 12px)
- **Background blobs**: Organic circles with high blur

## Components

### Glass Cards
Foundation component. 1px luminous border, 20px backdrop blur, 16px+ corner radius, subtle inset shadow.

### Luminous Buttons (Primary)
`bg-primary text-on-primary rounded-xl`. Hover: increase `saturate` + `brightness`. Shadow: `shadow-lg shadow-primary/20`.

### Secondary Buttons
`bg-white/5 border border-white/10`. Hover: `bg-white/10`.

### Inputs
`bg-surface-container-low border border-white/10 rounded-xl`. Focus: `border-primary shadow-[0_0_0_2px_rgba(214,186,255,0.1)]`.

### Code Snippets
`bg-surface-container-lowest rounded-2xl p-6 border border-white/5 font-mono`.

### Status Chips
Pill-shaped glass elements with colored dot (LED indicator style).

### Navigation
Top-pinned glass bar with `backdrop-blur-xl` and bottom luminous border.

## CSS Utilities

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02);
}

.glow-accent {
  filter: drop-shadow(0 0 8px rgba(214, 186, 255, 0.4));
}
```

## Background

```css
/* Page background */
background: radial-gradient(circle at top left, #1c1b1d 0%, #131315 100%);

/* Navbar / Glass surfaces */
background: rgba(var(--surface), 0.6);
backdrop-filter: blur(24px);
```
