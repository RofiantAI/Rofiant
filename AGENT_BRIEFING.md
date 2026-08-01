# Agent Briefing

## Project
Rofiant — Your AI Desktop Agent (Next.js + Tailwind v4)

## About Rofiant
A local-first AI desktop app for everyone. It reads, edits, and organizes
files, runs commands, and opens apps, in plain English — with reviewable
diffs, local or hosted language models, and MCP extensibility. This repo
is the marketing site, web dashboard, and API routes around that product.

## Design Tokens (globals.css)
- `--background`: #141414 (main background)
- `--foreground`: #f5f5f4 (main text)
- `--accent-primary`: #6b8afd (primary accent)
- `--accent-secondary`: #d1a752 (secondary accent)
- `--accent-success`: #45b787 (success/active states)
- `--accent-warning`: #e0a24d (warning states)
- `--border`: #27272a (card borders)
- `--card`: #141414 (card backgrounds)

## Primitives (components/ui/)
- `Button`: variant={primary|secondary|outline|ghost} size={sm|md|lg}
- `Card`, `CardHeader`, `CardContent`, `CardFooter`: variant={default|bordered|elevated}
- `Badge`: variant={default|success|warning|error|info} dot={boolean}

## Section Files
- `components/sections/header-section.tsx`
- `components/sections/hero-section.tsx`
- `components/sections/hero-section-cursor.tsx`
- `components/sections/hero-demo.tsx`
- `components/sections/stats-section.tsx`
- `components/sections/logo-cloud-section.tsx`
- `components/sections/unify-section.tsx`
- `components/sections/deploy-section.tsx`
- `components/sections/protect-section.tsx`
- `components/sections/public-ai-section.tsx`
- `components/sections/dmc-ad-section.tsx`
- `components/sections/footer-cta-section.tsx`
- `components/sections/footer-section.tsx`

## Forbidden Actions
- Don't modify globals.css tokens
- Don't edit files outside your section
- Don't add new primitives (use existing)
- Don't use external libraries

## Output
Each section file should be self-contained and match the source visually.
