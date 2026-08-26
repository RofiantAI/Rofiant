from typing import Any

import httpx

from app.agent.tools.base import AgentTool
from app.config import settings

COMPOSIO_API_BASE = "https://backend.composio.dev/api/v3.1"


class ComposioActionTool(AgentTool):
    """Executes a Composio-connected integration action (Gmail, Slack, GitHub,
    etc.) for the workspace's Composio user. Use composio_connect_account
    first if the account isn't connected yet.
    """

    name = "composio_action"
    description = (
        "Execute a third-party integration action connected via Composio "
        "(e.g. Gmail, Slack, GitHub, Notion). Use the exact Composio tool "
        "slug, e.g. GMAIL_SEND_EMAIL. If it fails because no account is "
        "connected, use composio_connect_account first."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "slug": {"type": "string", "description": "Composio tool slug, e.g. GMAIL_SEND_EMAIL."},
            "arguments": {"type": "object", "description": "Action input parameters, per the tool's schema."},
        },
        "required": ["slug", "arguments"],
    }

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        if not settings.composio_api_key:
            return "Error: Composio isn't configured (missing COMPOSIO_API_KEY)."

        slug = str(arguments["slug"])
        action_args = arguments.get("arguments") or {}
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{COMPOSIO_API_BASE}/tools/execute/{slug}",
                    headers={"x-api-key": settings.composio_api_key},
                    json={"user_id": settings.composio_user_id, "arguments": action_args},
                )
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            return f"Error executing Composio action {slug}: {exc}"

        body = resp.json()
        if body.get("successful") is False:
            return f"Composio action {slug} failed: {body.get('error')}"
        return str(body.get("data", body))


class ComposioConnectAccountTool(AgentTool):
    """Starts an OAuth link for a toolkit (e.g. gmail, slack, github) so
    composio_action can act on it afterward. Reuses an existing
    Composio-managed auth config for the toolkit, or creates one on first
    use -- Composio hosts the OAuth app, no dashboard setup required."""

    name = "composio_connect_account"
    description = (
        "Start connecting a third-party account (Gmail, Slack, GitHub, Notion, "
        "etc.) through Composio, so composio_action can use it. Returns a URL "
        "-- tell the user to open it and finish the authorization there. Use "
        "the toolkit's lowercase slug, e.g. gmail, slack, github, notion."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "toolkit": {"type": "string", "description": "Toolkit slug, e.g. gmail, slack, github."},
        },
        "required": ["toolkit"],
    }

    async def _auth_config_id(self, client: httpx.AsyncClient, toolkit: str) -> str:
        resp = await client.get(f"{COMPOSIO_API_BASE}/auth_configs", params={"toolkit_slug": toolkit})
        resp.raise_for_status()
        for item in resp.json().get("items", []):
            if item.get("status") == "ENABLED":
                return item["id"]

        resp = await client.post(f"{COMPOSIO_API_BASE}/auth_configs", json={"toolkit": {"slug": toolkit}})
        resp.raise_for_status()
        return resp.json()["auth_config"]["id"]

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        if not settings.composio_api_key:
            return "Error: Composio isn't configured (missing COMPOSIO_API_KEY)."

        toolkit = str(arguments["toolkit"]).lower()
        try:
            async with httpx.AsyncClient(
                timeout=30, headers={"x-api-key": settings.composio_api_key}
            ) as client:
                auth_config_id = await self._auth_config_id(client, toolkit)
                resp = await client.post(
                    f"{COMPOSIO_API_BASE}/connected_accounts/link",
                    json={"auth_config_id": auth_config_id, "user_id": settings.composio_user_id},
                )
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            return f"Error starting {toolkit} connection: {exc}"

        redirect_url = resp.json()["redirect_url"]
        return (
            f"Open this link to connect {toolkit}: {redirect_url}\n"
            "It expires in a few minutes -- ask me again if it does."
        )
