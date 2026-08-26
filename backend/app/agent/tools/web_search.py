import html
import re
from typing import Any

import httpx

from app.agent.tools.base import AgentTool
from app.config import settings

BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"
MAX_RESULTS = 5
_TAG_RE = re.compile(r"<[^>]+>")


def _strip_html(text: str) -> str:
    """Brave wraps matched query terms in the title/description with
    <strong> tags -- strip that markup so neither the model nor the UI
    that renders this tool's plain-text result sees raw HTML."""
    return html.unescape(_TAG_RE.sub("", text))


class WebSearchTool(AgentTool):
    name = "web_search"
    description = "Search the web for current information and return the top results (title, url, snippet)."
    input_schema = {
        "type": "object",
        "properties": {"query": {"type": "string", "description": "Search query."}},
        "required": ["query"],
    }

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        if not settings.brave_api_key:
            return "Error: web search isn't configured (missing BRAVE_API_KEY)."

        query = str(arguments["query"])
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(
                    BRAVE_SEARCH_URL,
                    params={"q": query, "count": MAX_RESULTS},
                    headers={"Accept": "application/json", "X-Subscription-Token": settings.brave_api_key},
                )
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            return f"Error searching the web: {exc}"

        results = resp.json().get("web", {}).get("results", [])
        if not results:
            return f"No results for: {query}"

        return "\n\n".join(
            f"{_strip_html(r.get('title', '(untitled)'))}\n{r.get('url', '')}\n{_strip_html(r.get('description', ''))}"
            for r in results[:MAX_RESULTS]
        )
