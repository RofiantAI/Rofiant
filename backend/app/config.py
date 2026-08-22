from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_anon_key: str
    supabase_jwt_secret: str
    supabase_service_role_key: str | None = None

    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-opus-5"
    gemini_api_key: str | None = None

    # Fallback for users with no provider of their own linked — a free-tier
    # OpenRouter model, paid for by the app. Nemotron Nano Omni: free, and
    # (unlike most free-tier models) supports both tool calls and image
    # input, so the agent loop and image uploads keep working on it.
    openrouter_api_key: str | None = None
    openrouter_model: str = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"

    e2b_api_key: str | None = None

    # "e2b" runs the agent's workspace in a cloud microVM; "local" runs it in a
    # container on this machine (docker or podman, whichever is on PATH), so
    # nothing leaves the user's computer. The local image needs `sh`; add git,
    # python, node etc. by pointing sandbox_image at your own image.
    sandbox_backend: str = "e2b"
    sandbox_image: str = "python:3.12-slim"
    # Container resource caps. Network stays on because agents pip/npm install;
    # set sandbox_network to "none" to cut it off.
    sandbox_memory: str = "2g"
    sandbox_cpus: str = "2"
    sandbox_network: str = "bridge"
    # e2b kills a sandbox 5min after last activity by default, which wipes its
    # files — bump this so a closed-then-reopened app still finds them.
    sandbox_timeout_seconds: int = 3600

    sentry_dsn: str | None = None

    # Per-user persistent cloud VM (Fly.io Machines), separate from the
    # per-conversation E2B/local sandboxes above. See services/fly.py,
    # services/machine.py, and backend/machine-agent/.
    fly_api_token: str | None = None
    fly_org: str | None = None
    # All user Machines live under one Fly App (Fly Apps are a
    # networking/namespace unit, not the VM itself -- the Machine is the
    # VM). Simpler than provisioning one App per user.
    fly_app: str = "kirobots-machines"
    fly_region: str = "yyz"
    machine_image: str | None = None
    # Shared HMAC key: backend signs requests to the agent, the agent (baked
    # in at image build / set as a Fly secret on the app) verifies them. No
    # per-machine secret is stored in the database.
    machine_agent_signing_secret: str | None = None
    # This service's own public URL -- injected into every Machine's env so
    # the agent knows where to POST its heartbeat.
    backend_url: str | None = None


settings = Settings()
