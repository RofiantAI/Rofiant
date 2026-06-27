# UI Polish Design — Rofiant Web

## Scope

Polish pass on existing dark-theme marketing site. No content, layout, or structural changes. 8 targeted UI improvements.

## 1. Scale Section Background

**File:** `src/components/sections/scale-section.tsx`

Replace `bg-[#c7d2fe]` (lavender) with dark background + subtle blue radial gradient overlay.

```
- className="py-24 bg-[#c7d2fe]"
+ className="py-24 bg-background relative overflow-hidden"
```

Add child div with radial gradient:
```
<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
```

Update all `text-gray-900` → `text-foreground`, `text-gray-700` → `text-foreground-secondary`, `text-gray-600` → `text-foreground-muted`, `text-gray-400` → `text-foreground-muted`.

Button variant change: `bg-gray-900 text-white hover:bg-gray-800` → use default `variant="primary"`.

## 2. Header Refinement

**File:** `src/components/sections/header-section.tsx`

```
- className="sticky top-0 z-50 w-full border-b border-border bg-foreground"
+ className="sticky top-0 z-50 w-full border-b border-border/50 bg-foreground/80 backdrop-blur-xl"
```

## 3. Hero SVG Animation

**File:** `src/components/sections/hero-section.tsx`

Add CSS keyframe animation to globals.css:
```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.12; }
  50% { opacity: 0.25; }
}
```

Apply to glow circles (lines 133-134, 139-140):
```
- <circle cx="453" cy="421" r="28" fill="#eab308" opacity="0.12" />
+ <circle cx="453" cy="421" r="28" fill="#eab308" opacity="0.12" style={{ animation: 'pulse-glow 4s ease-in-out infinite' }} />
```

Same for the green glow circles.

## 4. Card Hover States

**File:** `src/components/ui/card.tsx`

Update variantStyles:
```
- bordered: "bg-card border border-border",
+ bordered: "bg-card border border-border transition-all duration-300 hover:border-border-light hover:shadow-lg hover:-translate-y-0.5",
```

```
- elevated: "bg-card border border-border shadow-lg",
+ elevated: "bg-card border border-border shadow-lg transition-all duration-300 hover:border-border-light hover:shadow-xl hover:-translate-y-0.5",
```

## 5. Scroll Reveal Component

**New file:** `src/components/ui/scroll-reveal.tsx`

Client component using IntersectionObserver. Props: `delay` (ms), `direction` ('up' | 'down' | 'none'). Default: fade-up 20px, 600ms duration, `once: true`.

Apply to sections in `page.tsx`: wrap each section with `<ScrollReveal>`. For grid children in unify-section, add staggered delays (0, 100, 200, 300ms).

## 6. Footer CTA Gradient

**File:** `src/components/sections/footer-cta-section.tsx`

Replace both light radial gradient divs (lines 7-20) with single dark brand-gradient:

```jsx
<div
  className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full"
  style={{
    background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(234,179,8,0.06) 40%, transparent 70%)",
  }}
/>
```

## 7. Button Hover Polish

**File:** `src/components/ui/button.tsx`

Update variantStyles:
```
- primary: "bg-button-primary text-button-primary-foreground hover:bg-foreground/90",
+ primary: "bg-button-primary text-button-primary-foreground hover:bg-foreground/90 hover:shadow-sm",
```

```
- outline: "bg-button-outline text-button-outline-foreground border border-border hover:bg-background-tertiary",
+ outline: "bg-button-outline text-button-outline-foreground border border-border hover:bg-background-tertiary hover:border-border-light",
```

```
- ghost: "bg-transparent text-foreground hover:bg-background-tertiary",
+ ghost: "bg-transparent text-foreground hover:bg-background-tertiary hover:shadow-sm",
```

## 8. Section Transitions & Polish

**File:** `src/app/globals.css`

Add smooth scroll:
```css
html { scroll-behavior: smooth; }
```

Add pulse-glow keyframe (from #3).

Add marquee animation for logo cloud:
```css
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

**File:** `src/components/sections/logo-cloud-section.tsx`

Duplicate logos array, wrap in overflow-hidden container, apply marquee animation. CSS-only, no JS.

**File:** `src/components/sections/stats-section.tsx`

Replace `border-y border-border` with gradient separator:
```
- className="py-12 border-y border-border"
+ className="py-12 relative"
```

Add gradient divs top and bottom using `bg-gradient-to-r from-transparent via-border to-transparent`.

## Files Modified

| File | Change |
|------|--------|
| `src/app/globals.css` | Smooth scroll, keyframes |
| `src/components/ui/card.tsx` | Hover states |
| `src/components/ui/button.tsx` | Hover polish |
| `src/components/ui/scroll-reveal.tsx` | New component |
| `src/components/sections/header-section.tsx` | Backdrop blur |
| `src/components/sections/hero-section.tsx` | SVG animation |
| `src/components/sections/stats-section.tsx` | Gradient separator |
| `src/components/sections/logo-cloud-section.tsx` | Marquee |
| `src/components/sections/scale-section.tsx` | Fix bg color |
| `src/components/sections/footer-cta-section.tsx` | Dark gradient |
| `src/app/page.tsx` | ScrollReveal wrappers |

## Not Changing

- Copy/content
- Font family or scale
- Color tokens (--accent-primary, etc.)
- Section order or layout structure
- Component props/APIs
