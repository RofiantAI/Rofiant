import re
from urllib.parse import urlsplit
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth import AuthContext, get_current_user
from app.schemas.skill import SkillCreate, SkillOut
from app.services.supabase import get_user_client

router = APIRouter(prefix="/api/skills", tags=["skills"])

# Only fetch from GitHub-controlled hosts, over https, to keep the install
# endpoint from being an open SSRF proxy (no localhost/internal IPs, no
# arbitrary redirects).
_ALLOWED_HOSTS = {"raw.githubusercontent.com", "gist.githubusercontent.com"}
_BLOB_URL_RE = re.compile(r"^https://github\.com/([^/]+/[^/]+)/blob/(.+)$")
_MAX_BYTES = 100_000


def _to_raw_url(source_url: str) -> str:
    """A github.com/.../blob/... link is the URL users actually copy; turn
    it into the raw content URL rather than making them do it by hand."""
    m = _BLOB_URL_RE.match(source_url)
    if m:
        return f"https://raw.githubusercontent.com/{m.group(1)}/{m.group(2)}"
    return source_url


def _parse_skill_md(text: str) -> tuple[str, str]:
    """Pull `name`/`description` out of a Claude-style SKILL.md frontmatter
    block (--- ... ---). Falls back to empty strings if absent."""
    name, description = "", ""
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            for line in text[3:end].splitlines():
                if ":" not in line:
                    continue
                key, _, value = line.partition(":")
                key, value = key.strip().lower(), value.strip()
                if key == "name":
                    name = value
                elif key == "description":
                    description = value
    return name, description


@router.get("", response_model=list[SkillOut])
async def list_skills(auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    resp = client.table("skills").select("id,name,description,source_url,created_at").order("created_at").execute()
    return resp.data


@router.post("", response_model=SkillOut, status_code=status.HTTP_201_CREATED)
async def install_skill(body: SkillCreate, auth: AuthContext = Depends(get_current_user)):
    raw_url = _to_raw_url(body.source_url)
    parsed = urlsplit(raw_url)
    if parsed.scheme != "https" or parsed.hostname not in _ALLOWED_HOSTS:
        raise HTTPException(
            status_code=400,
            detail="source_url must be a raw.githubusercontent.com (or github.com blob) URL",
        )

    async with httpx.AsyncClient(follow_redirects=False, timeout=10.0) as http:
        try:
            resp = await http.get(raw_url)
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=400, detail=f"Fetch failed: {exc}") from exc
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Fetch failed: HTTP {resp.status_code}")
    if len(resp.content) > _MAX_BYTES:
        raise HTTPException(status_code=400, detail="Skill file too large (100KB limit)")

    content = resp.text
    name, description = _parse_skill_md(content)
    name = name or body.source_url.rsplit("/", 1)[-1]

    client = get_user_client(auth.access_token)
    row = (
        client.table("skills")
        .insert(
            {
                "user_id": auth.user_id,
                "name": name,
                "description": description,
                "content": content,
                "source_url": body.source_url,
            }
        )
        .execute()
    )
    return row.data[0]


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(skill_id: UUID, auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    client.table("skills").delete().eq("id", str(skill_id)).execute()
