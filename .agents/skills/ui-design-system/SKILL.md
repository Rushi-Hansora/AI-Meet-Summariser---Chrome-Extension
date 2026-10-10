---
name: ui-design-system
description: >-
  Use this skill when creating or modifying UI elements in the popup or options
  pages. Covers the dark glassmorphism design system, CSS variable tokens,
  component patterns, animation library, and responsive popup layout conventions.
---

# UI Design System — AI Meet Summarizer

## Design Tokens (CSS Variables)

All colors and design values are defined as CSS custom properties on `:root`.
**Always use these variables** — never hardcode colors.

```css
:root {
  /* Backgrounds */
  --bg-color: #0b0f19;
  --card-bg: rgba(22, 28, 45, 0.65);
  --border-color: rgba(255, 255, 255, 0.08);

  /* Text */
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;

  /* Accent Colors */
  --primary-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  --primary-glow: rgba(99, 102, 241, 0.35);
  --success: #10b981;
  --success-glow: rgba(16, 185, 129, 0.25);
  --danger: #ef4444;
  --danger-glow: rgba(239, 68, 68, 0.35);
  --warning: #f59e0b;
  --accent: #06b6d4;  /* Used for live captions */
}
```

## Typography
- **Font**: `Outfit` from Google Fonts (weights: 300, 400, 500, 600, 700)
- **Loading**: Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`
- **Sizes**: h1=18px, labels=14px, body=13px, meta=12px, tiny=11px, micro=10px

## Component Patterns

### Cards (Glassmorphism)
```css
.card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(12px);
}
```

### Buttons
| Class | Use Case |
|---|---|
| `.btn-primary` | Main actions (Start Capturing, Generate Reports) — gradient bg with glow shadow |
| `.btn-danger` | Destructive actions (Stop Capturing) — solid red with glow |
| `.btn-secondary` | Secondary actions (Copy, Download, Clear) — transparent with border |

### Status Pills
```css
.status-pill        /* Base: muted, inactive */
.status-active      /* Green glow: connected */
.status-capturing   /* Red glow + pulsing dot: recording */
```

### Alert Bars
```css
.alert-warning   /* Amber: API key missing, captions off */
.alert-danger    /* Red: not on Google Meet */
```

### Tabs
- Navigation: `.tabs-nav` with `.tab-btn` buttons
- Active state: purple text + gradient underline with glow
- Content: `.tabs-content` with `.tab-panel` divs

## Animations

| Name | Duration | Use |
|---|---|---|
| `fadeIn` | 0.3s | Tab switching, alerts appearing |
| `pulse` | 1.2s | Recording dot, live speaker indicator |
| `spin` | 1s | Loading spinner during AI generation |

## Glow Decorations
Both popup and options pages use `::before` / `::after` pseudo-elements with `radial-gradient` for subtle background glow effects.

## Scrollbar Styling
```css
.tabs-content::-webkit-scrollbar { width: 6px; }
.tabs-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
```

## Layout Constraints
- Popup: `width: 580px`, `min-height: 480px`
- Options: `max-width: 500px`, centered with `margin: 0 auto`
- Content area: `min-height: 220px`, `max-height: 320px` (scrollable)

## Adding New UI Elements

1. Use existing CSS variables — don't introduce new colors.
2. Follow the glassmorphism pattern for any new containers.
3. Add `animation: fadeIn 0.3s ease` for elements that appear dynamically.
4. Escape all dynamic text with `escapeHtml()` before inserting.
5. Keep inline styles in `<style>` tags — no external CSS files.
6. Test at `580px` width to ensure nothing overflows.
