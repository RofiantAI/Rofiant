# Rofiant Web

Marketing site, web dashboard, and web chat client for **Rofiant** — a
local-first AI desktop app that reads and edits files on your machine with
reviewable diffs, connects to local or hosted language models, and extends
itself over MCP. The desktop client itself lives in a separate repo
([RofiantAI/RofiantDesktop](https://github.com/RofiantAI/RofiantDesktop));
this repo is the surrounding web product.

## What's in this repo

- **Marketing site** (`src/app/(app)`) — localized (EN/ES/FR/DE) pages for
  the product, pricing, company/legal info, and app downloads.
- **Dashboard** (`src/app/(dashboard)`) — account settings, API keys, usage,
  audit log, and admin views for signed-in users.
- **Web chat** (`src/app/(chat)`) — browser-based chat client.
- **API routes** (`src/app/api`) — chat/agents, documents, voice, billing
  (Creem checkout + webhooks), auth, and other backend endpoints.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) for auth and data
- [next-intl](https://next-intl.dev) for i18n (`en`, `es`, `fr`, `de`)
- [Vercel AI SDK](https://ai-sdk.dev) for chat/agent completions

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Environment variables
are read from `.env.local` (see that file for the required keys — Supabase,
AI provider, Creem, etc.).

## License

Proprietary. See [LICENSE](./LICENSE). All rights reserved — no reuse,
copying, or distribution without written permission from Rofiant AI.
