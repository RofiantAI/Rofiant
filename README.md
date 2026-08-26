# Rofiant

Cross-platform desktop AI agent app. Chat, projects, files, sandboxed terminal, Git, browser control.

## Stack

Desktop: Tauri 2 + React + TypeScript + Tailwind + shadcn/ui + Zustand + TanStack Query.
Backend (added in a later phase): Python + FastAPI on Railway.
Data/auth: Supabase (Postgres, Auth, Realtime, Storage).

## Project structure

```text
apps/
  desktop/          Tauri + React frontend
    src/
      components/   chat/, sidebar/, terminal/, files/, agents/, auth/, ui/
      pages/          ChatPage, LoginPage, SignupPage, SettingsPage
      hooks/          useConversations, useMessages (Supabase-backed), useAgentRun (SSE),
                      useProviderConnections (Anthropic OAuth / OpenAI key)
      stores/         Zustand UI state (useUIStore, useAuthStore)
      types/          shared TS types (mirror the DB row shape)
      lib/            utils (cn helper), supabase.ts, api.ts (backend fetch + JWT)
    src-tauri/        Rust shell
backend/
  app/
    main.py            FastAPI app, CORS, /health
    api/               auth.py (JWT verify dependency), conversations.py, messages.py (+ /stream, SSE),
                       providers.py (Anthropic OAuth + OpenAI key connections)
    agent/
      models/          base.py (ModelProvider interface), anthropic.py (tool-use capable)
      tools/           base.py (AgentTool + workspace path-traversal guard),
                       filesystem.py, terminal.py, git.py
      runner.py        the agent loop: model turn, tool calls, repeat, bounded by
                       MAX_STEPS/MAX_TOOL_CALLS
      prompts.py       system prompt
    api/               ...(auth, conversations, messages, providers,) workspaces.py
                       (real file listing/reading + tool_calls history)
    schemas/           Pydantic request/response models
    services/          supabase.py (RLS-scoped Postgrest client per request),
                       anthropic_oauth.py, provider_connections.py,
                       sandbox.py (SandboxProvider + E2BSandboxProvider),
                       workspace.py (lazy per-conversation sandbox creation)
    config.py          Settings (env vars)
supabase/
  migrations/        SQL schema + RLS policies
```

## Development (Arch Linux)

Prerequisites:

```bash
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module gtk3 librsvg
```

Node deps use pnpm, already the default package manager here.

```bash
cd apps/desktop
pnpm install
cp .env.example .env   # fill in Supabase values, see below
pnpm tauri dev
```

You should land on a login screen. Sign up, confirm the email Supabase sends
(or disable confirmation in the Supabase dashboard for local testing), then
log in. You should then see a dark desktop window: left sidebar (New Chat,
chat list, Projects, Settings, Log out) and a main panel with a chat view on
top and Agent Activity / Files / Terminal tabs on the bottom.

Conversations and messages are real rows in Supabase (RLS-scoped to your
user). Sending a message calls the backend's `/api/messages/stream`, which
runs the real agent loop (`backend/app/agent/runner.py`): the model replies,
and if it decides it needs to read/write a file, run a shell command, or
check git status/diff, it calls a tool. The backend executes that tool in
an E2B sandbox (created lazily, on the first tool call for that conversation,
not for plain chat), feeds the result back, and repeats until the model is
done or a step/call limit is hit. Agent Activity, Files, and Terminal in the
workspace panel now show this for real: Agent Activity and Terminal read the
persisted `tool_calls` (plus a live view while a run is streaming), Files
lists and reads directly from the sandbox via `/api/workspaces/*`.

Type-check and production build:

```bash
pnpm exec tsc --noEmit
pnpm build
```

## Backend (FastAPI)

Prerequisites: `uv` (`sudo pacman -S uv`).

```bash
cd backend
cp .env.example .env   # fill in Supabase values, see below
uv sync
uv run uvicorn app.main:app --reload
```

`GET /health` → `{"status": "ok"}`. Every other route requires
`Authorization: Bearer <supabase-jwt>`. The backend verifies the token itself
(never trusts a client-sent user id) and then talks to Postgrest with that
same JWT, so Supabase RLS applies identically to backend and direct-client
requests: `GET/POST /api/conversations`, `POST /api/messages` (plain insert),
and `POST /api/messages/stream` (SSE: loads history, calls the model, streams
the reply, persists it on completion).

`app/agent/models/base.py` defines `ModelProvider`, a one-method
(`generate`) async-streaming interface. `app/agent/models/anthropic.py` is
the only implementation right now (Claude, via the official `anthropic`
SDK). Swap in an `OpenAIProvider` or `GeminiProvider` later without
touching the route or the agent loop, since nothing outside `agent/models/`
imports the Anthropic SDK directly. Same pattern for sandboxes:
`app/services/sandbox.py` defines `SandboxProvider`
(create/execute/read_file/write_file/list_files/destroy) with
`E2BSandboxProvider` as the only implementation. Swap providers there without
touching `agent/tools/` or the runner.

Tools (`app/agent/tools/`) all take a `sandbox_id` and validate every path
through `resolve_workspace_path()` (`agent/tools/base.py`) before touching the
sandbox: joins onto a fixed workspace root and rejects anything that
resolves outside it (`../../etc/passwd`-style traversal). The `terminal` tool
has no command allowlist yet. The sandbox's own isolation (E2B: ephemeral
VM, no host access, no secrets) is the safety boundary for now; see the
`ponytail:` comment in `agent/tools/terminal.py` if that's not enough later.
Loop protections live in `runner.py`: `MAX_STEPS = 8`, `MAX_TOOL_CALLS = 20`
per run. No wall-clock `max_runtime` yet.

Desktop-side, `src/hooks/useAgentRun.ts` calls `/api/messages/stream` with
`fetch` (not `EventSource`, since that can't send the `Authorization` header),
parses the `event:`/`data:` frames by hand, and accumulates the delta text
into a live draft bubble in `ChatView`.

### Bring-your-own account (Settings)

Instead of every user drawing from the app's shared `ANTHROPIC_API_KEY`, a
user can connect their own account from the desktop Settings page:

- **Anthropic (Claude Pro/Max)**: real OAuth sign-in. Clicking Connect opens
  the system browser to `claude.ai/oauth/authorize`; after approving, the
  user pastes back the code Anthropic shows them, and the backend exchanges
  it for an access/refresh token pair (`app/services/anthropic_oauth.py`),
  stored in the new `provider_connections` table. `/api/messages/stream`
  checks for a connected token first (refreshing it if expired) and only
  falls back to the shared server key if the user hasn't connected one.

  This is not a published Anthropic integration. It reuses the `client_id`
  and request headers of Anthropic's own Claude Code CLI, the same way
  several open-source tools (opencode, openclaw) do, so a signed-in user's
  Claude Pro/Max quota powers their own self-hosted backend. The user
  authenticates their own account; it's not an exploit against Anthropic or
  other users. It is unofficial, though: Anthropic could rotate the client ID
  or start rejecting non-CLI user agents at any time, breaking this without
  warning. See the module docstring in `anthropic_oauth.py` for specifics.

  We looked at doing the same for OpenAI/ChatGPT (Codex) and deliberately
  didn't: Codex's real inference calls carry an app-attestation header
  (`X_OAI_ATTESTATION_HEADER`) that's specifically designed to reject
  non-official clients, so this path is a dead end, not just unofficial.

- **OpenAI**: plain bring-your-own-API-key. Paste a key from
  platform.openai.com; it's stored (currently plaintext, see the security
  note below) and used for OpenAI requests once an `OpenAIProvider` exists
  (not yet: phase 5 only implemented Anthropic).

**Security note:** `provider_connections.access_token` /
`refresh_token` / `api_key` are stored **unencrypted**, protected only by
Postgres RLS. These are live credentials against a real paid account.
Treat this as an MVP simplification, not something to ship to real users
without adding column-level encryption (pgsodium/Vault, or envelope
encryption in the backend before the write). Flagged in the migration file
too.

## Supabase setup

1. Create a project at supabase.com (free tier is fine).
2. Project Settings → API: copy the Project URL and the `anon` `public` key
   into `apps/desktop/.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Authentication → Providers: email/password is on by default. For local
   dev without a real inbox, Authentication → Settings → turn off "Confirm
   email" so signup logs you in immediately.
4. The `anon` key is safe in the desktop app. The `service_role` key is not:
   it only ever goes into the Railway backend's environment, never into
   `apps/desktop`.
   Project Settings → API → JWT Settings has the `SUPABASE_JWT_SECRET` the
   backend needs to verify tokens locally (no round trip to Supabase per
   request).
5. Apply the schema: SQL Editor → paste and run every file in
   `supabase/migrations/` **in filename order** (0001 → 0005+). Or
   `supabase db push` with the Supabase CLI if you're linked to the project.
   `0001` creates `profiles`, `conversations`, `messages` + RLS + the
   signup/updated_at triggers. `0002` adds `provider_connections`
   (bring-your-own-account, above). `0003` fixes a grants gotcha (RLS
   restricts access but doesn't itself grant the base table privileges a
   role needs. SQL-Editor-created tables don't get that automatically the
   way Table-Editor-created ones do). `0005` adds `workspaces` and
   `tool_calls` for real agent tool execution (below). If you add a table by
   hand later, remember the 0003 grant step or you'll hit
   `permission denied for table X` (Postgres 42501) even with correct RLS.

## Environment variables

`apps/desktop/.env` (desktop app, safe to expose client-side):

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
VITE_WEB3FORMS_ACCESS_KEY=
```

`backend/.env` (server-only secrets, never shipped to the desktop app):

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

E2B_API_KEY=
SENTRY_DSN=
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` are required to
boot the backend; `ANTHROPIC_API_KEY` is required for `/api/messages/stream`
to actually reply (unless the user has connected their own account in
Settings). `E2B_API_KEY` (from e2b.dev, real account + billing) is required
for anything tool-related: the moment the model tries to read/write a file or
run a command, the backend calls E2B to create a sandbox, and that fails
without a key. Plain chat with no tool use works fine without it. The rest
(`OPENAI_API_KEY`, `GEMINI_API_KEY`, `SENTRY_DSN`) are still unused, reserved
for later phases.

## Roadmap

Phase 1 (done): desktop shell, layout, mock UI state.
Phase 2 (done): Supabase auth (signup/login/logout), protected routes.
Phase 3 (done): conversations/messages schema + RLS, live-wired chat list and
message history via TanStack Query.
Phase 4 (done): FastAPI backend: `/health`, JWT-verified `/api/conversations`
and `/api/messages`, RLS-scoped Postgrest client, Dockerfile + railway.toml.
Phase 5 (done): `ModelProvider` abstraction + Anthropic implementation,
`/api/messages/stream` SSE endpoint, live-streamed assistant replies in the
desktop chat view.
Off-roadmap, done at user request: Settings page, Anthropic Claude Pro/Max
OAuth sign-in (unofficial, see above) and OpenAI bring-your-own-API-key;
custom window titlebar (real macOS-style traffic lights); UI restyle; bot
personas (`conversations.persona`, migration 0006): "new chat" opens a bot
gallery (Agent / Builder / Reviewer / Explainer / Rubber Duck) and picking one
is what creates the conversation, titled after the bot and fixed to it for
life — the persona appends a paragraph to the system prompt on every run, so a
mid-chat switch would rewrite the premise of the existing history. An empty
chat shows the bot's card instead of a greeting message row. Each bot
has an animated CSS face (`components/personas/PersonaFace.tsx`: colored shape,
idle bob, blinking eyes) that replaces the old initial-based conversation
avatar in the sidebar and titlebar. Prompt text
lives in `backend/app/agent/prompts.py`, the picker's labels in
`apps/desktop/src/lib/personas.ts`; `backend/test_personas.py` fails if the two
id lists drift apart.
Phase 6/7 (done): real agent loop with tool calls (`runner.py`), E2B-backed
sandboxed tools (read_file, write_file, list_files, terminal, git_status,
git_diff), workspaces + tool_calls tables, Agent Activity / Files / Terminal
wired to real data instead of mock state.
Phase 8+: agent_runs table + run status/cancel endpoint, Git panel proper
(not just the two read-only tools), browser automation.

## Cloud Computer (persistent per-user VM)

Separate from the per-conversation E2B/local sandboxes above: every Supabase
user can also have exactly **one** persistent Linux VM (a Fly.io Machine)
that survives across sessions, with a small daemon on it that starts/stops
long-running bots. This is for standalone bots the user wants running
whether or not the app is open, not for the agent's own tool-call sandbox.

```text
Desktop -> FastAPI (Railway) -> Supabase (auth + user_machines/bots) -> Fly Machines API -> 1 VM per user
```

**Database** (`supabase/migrations/0012_user_machines.sql`): `user_machines`
(one row per user, `user_id` UNIQUE -- this is both the "exactly one VM"
constraint and the concurrency lock for provisioning), `bots`, `machine_jobs`
(outbox of start/stop/restart commands sent to the agent), `machine_events`
(inbox: heartbeats, provisioning results). RLS: users can only `select` their
own `user_machines` row (provider ids, status) -- no insert/update/delete
policy exists for `authenticated` at all, so only the service-role backend
can write it. `bots` gets full owner CRUD policies like `conversations`.

**Backend**:
- `app/services/fly.py` -- `FlyProvider`, a thin wrapper over the Fly
  Machines API (create/start/stop/restart/delete a Machine, create/delete a
  Volume). `FLY_API_TOKEN` never leaves this file.
- `app/services/machine.py` -- owns every write to `user_machines`.
  `ensure_machine()` is the idempotent entry point: it does an
  `INSERT ... ON CONFLICT (user_id) DO NOTHING` first, so under concurrent
  requests exactly one caller's insert lands and does the real provisioning
  (create volume -> create machine -> wait for started); everyone else just
  reads back the (possibly still-provisioning) row. Any failure mid-flight
  sets `status='error'` with `error_message` -- it never leaves the row
  claiming `running` after a failed provision.
- `app/services/machine_agent_client.py` -- backend -> agent calls. The
  backend runs on Railway, off Fly's private 6PN network, so it calls the
  Machine over the Fly App's public edge (`<app>.fly.dev`) targeting the
  right instance with the `fly-force-instance-id` header. Every request
  (both directions -- also used for the agent's heartbeat back to the
  backend) is HMAC-signed with `MACHINE_AGENT_SIGNING_SECRET` over
  `machine_id:timestamp:sha256(body)`, checked with `hmac.compare_digest`
  and a 60s replay window. There is no Fly API token, no SSH, no shell
  endpoint anywhere in this path.
- `app/api/machine.py` -- `GET/POST /api/machine{,/ensure,/start,/stop,/restart}`
  (JWT-authenticated, user-scoped) plus `POST /api/machine/agent/heartbeat`
  (HMAC-authenticated, called by the agent, not the browser).
- `app/api/bots.py` -- `POST/GET /api/bots`, `DELETE /api/bots/{id}`.
  Creating a bot calls `ensure_machine()` first (reuses the existing VM if
  there is one), inserts the `bots` row, then forwards a `start_bot` job to
  the agent if the machine is already running. Deleting a bot stops it on
  the agent and marks the row `deleted` -- it never touches the machine
  itself.

**Machine agent** (`backend/machine-agent/`, deployed as the VM image, not
part of the Railway backend): a small FastAPI daemon (`agent.py`) that boots
with the Machine. HMAC-verifies every request except `/health`. `POST /jobs`
starts/stops/restarts a bot as a real subprocess (list-of-args `exec`, never
a shell string built from request input) under `/workspace/bots/<bot-id>/`,
which is sanitized to a bare UUID (blocks `../` traversal). `GET /status` and
`GET /bots/{id}/logs` report back. Sends a signed heartbeat to the backend
every 30s. On boot it reconciles: bots with a persisted `state.json` on the
volume (which survives a Machine restart/replace, unlike the image's own
filesystem) get restarted. On shutdown it stops every bot child first.

**VM image** (`backend/machine-agent/Dockerfile`): `python:3.12-slim`
(Debian-based), non-root `agent` user (uid 1000) runs the daemon and every
bot process it spawns. `entrypoint.sh` runs as root only long enough to
`chown` the freshly-mounted volume, then `exec su`s down to `agent` before
starting uvicorn -- nothing in the actual daemon or bot processes runs as
root. Persistent layout on the volume, mounted at `/workspace`:

```text
/workspace/
  shared/
  bots/<bot-id>/{logs/,state.json}
  state/
```

**Resource model**: all Machines live under one shared Fly App
(`FLY_APP`, default `kirobots-machines`) -- a Fly App is a
networking/namespace unit, not the VM itself; the Machine is the VM, and
each user gets exactly one Machine. No per-user Fly App, no per-bot Machine.
Users never supply a Fly resource id themselves; every route resolves the
Machine from the authenticated user's `user_machines` row.

**What's not built**: idle-timeout auto-stop (the lifecycle supports
`running -> stopped` today via the `/stop` route; wiring an actual idle
timer is a later cron/job, not added here since the prompt said don't
implement aggressive auto-shutdown yet), a real bot runtime/template system
(a bot's `config.command` is currently caller-supplied and just gets
`exec`'d as-is by the agent -- fine as the plumbing, but a real product
would resolve bot "kind" to a fixed, server-approved command server-side
rather than trusting whatever list of strings the client sends), and
WebSocket log streaming (logs are polled via `GET /bots/{id}/logs` today,
not streamed).

### Environment variables (Cloud Computer)

Added to `backend/.env`:

```text
FLY_API_TOKEN=                          # flyctl auth token, e.g. `fly tokens create org KiroBot`
FLY_ORG=                                # your Fly org slug
FLY_APP=kirobots-machines               # shared app all user Machines live under
FLY_REGION=yyz                          # Fly region code, e.g. yyz = Toronto
MACHINE_IMAGE=                          # registry.fly.io/kirobots-machines:latest, after pushing
MACHINE_AGENT_SIGNING_SECRET=           # random string, e.g. `openssl rand -hex 32`
```

`MACHINE_AGENT_SIGNING_SECRET` must be identical in the backend's env and
baked into every Machine (it's injected per-Machine via `env` in
`FlyProvider.create_machine`, so setting it once in Railway is enough --
nothing extra to configure on the Fly side).

### Fly.io setup

```bash
# once
fly auth login
fly apps create kirobots-machines --org <your-org>   # or let ensure_app() do this on first use
fly volumes list -a kirobots-machines                 # sanity check after first provision

# build + push the VM image (from backend/machine-agent/)
cd backend/machine-agent
fly deploy --build-only --push
# copy the pushed image ref (registry.fly.io/kirobots-machines:<tag>) into MACHINE_IMAGE
```

### Railway setup

Add the six env vars above to the existing backend service's variables (same
place `SUPABASE_*`/`E2B_API_KEY` already live). No new Railway service is
needed -- the machine agent isn't deployed to Railway, it's baked into the
Fly image and runs on Fly Machines.

### Local development

The Fly Machines API has no local emulator. To develop against this locally
without real Fly infra, run `machine-agent/agent.py` directly and point the
backend's HMAC calls at it manually, or simplest: skip local testing of the
provisioning path and unit-test `app/services/machine.py`'s idempotency
logic against a mocked `FlyProvider`. Real end-to-end testing needs a real
`FLY_API_TOKEN` and a pushed image.
