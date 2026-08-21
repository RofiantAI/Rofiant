from supabase import Client, create_client

from app.config import settings


def get_user_client(access_token: str) -> Client:
    """Postgrest client scoped to the caller's JWT, so Supabase RLS applies
    exactly as it would for a direct client-side request."""
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client


def get_admin_client() -> Client:
    """Service-role client for the Auth Admin API (ban/delete a user) — RLS
    and the anon key can't do either, so this is the only client that can."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
