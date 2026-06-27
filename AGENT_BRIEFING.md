# Agent Briefing

## Project
Rofiant — AI for Government & Enterprise (Next.js + Tailwind v4)

## About Rofiant
AI company (like ChatGPT) with federal agency options (police, military, intelligence). Secure, compliant, mission-ready.

## Design Tokens (globals.css)
- `--background`: #0a0a0a (main background)
- `--foreground`: #ffffff (main text)
- `--accent-primary`: #eab308 (yellow highlights)
- `--accent-secondary`: #3b82f6 (blue accents)
- `--accent-success`: #22c55e (green badges)
- `--border`: #27272a (card borders)
- `--card`: #111111 (card backgrounds)

## Primitives (components/ui/)
- `Button`: variant={primary|secondary|outline|ghost} size={sm|md|lg}
- `Card`, `CardHeader`, `CardContent`, `CardFooter`: variant={default|bordered|elevated}
- `Badge`: variant={default|success|warning|error|info} dot={boolean}

## Section Files
- `components/sections/header-section.tsx`
- `components/sections/hero-section.tsx`
- `components/sections/stats-section.tsx`
- `components/sections/logo-cloud-section.tsx`
- `components/sections/unify-section.tsx`
- `components/sections/deploy-section.tsx`
- `components/sections/protect-section.tsx`
- `components/sections/scale-section.tsx`
- `components/sections/monitor-section.tsx`
- `components/sections/developer-section.tsx`
- `components/sections/footer-cta-section.tsx`
- `components/sections/footer-section.tsx`

## Forbidden Actions
- Don't modify globals.css tokens
- Don't edit files outside your section
- Don't add new primitives (use existing)
- Don't use external libraries

## Output
Each section file should be self-contained and match the source visually.