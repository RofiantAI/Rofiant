"""Fly.io Machines API client. Server-side only -- FLY_API_TOKEN never
leaves the backend. See https://fly.io/docs/machines/api/.

Thin wrapper: one method per operation machine.py needs (create/start/stop/
restart/status/delete a Machine, create/delete a Volume). No retry/backoff
here -- that lives in machine.py, which knows what's safe to retry and what
must instead mark the machine `error` and stop.
"""

import httpx

from app.config import settings

FLY_API_BASE = "https://api.machines.dev/v1"


class FlyAPIError(RuntimeError):
    def __init__(self, status_code: int, body: str):
        super().__init__(f"Fly API error {status_code}: {body}")
        self.status_code = status_code
        self.body = body


class FlyProvider:
    def __init__(self) -> None:
        if not settings.fly_api_token:
            raise RuntimeError("FLY_API_TOKEN is not configured")
        self._client = httpx.AsyncClient(
            base_url=FLY_API_BASE,
            headers={"Authorization": f"Bearer {settings.fly_api_token}"},
            timeout=30,
        )

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        resp = await self._client.request(method, path, **kwargs)
        if resp.status_code >= 400:
            raise FlyAPIError(resp.status_code, resp.text)
        if not resp.content:
            return {}
        return resp.json()

    async def ensure_app(self) -> None:
        """Create the shared Fly App if it doesn't exist yet. Idempotent --
        a 422 "already exists" is treated as success."""
        try:
            await self._request(
                "POST",
                "/apps",
                json={"app_name": settings.fly_app, "org_slug": settings.fly_org},
            )
        except FlyAPIError as exc:
            if exc.status_code not in (409, 422):
                raise

    async def create_volume(self, *, name: str, size_gb: int = 10) -> str:
        body = await self._request(
            "POST",
            f"/apps/{settings.fly_app}/volumes",
            json={
                "name": name,
                "region": settings.fly_region,
                "size_gb": size_gb,
            },
        )
        return body["id"]

    async def delete_volume(self, volume_id: str) -> None:
        try:
            await self._request(
                "DELETE", f"/apps/{settings.fly_app}/volumes/{volume_id}"
            )
        except FlyAPIError as exc:
            if exc.status_code != 404:
                raise

    async def create_machine(
        self, *, name: str, volume_id: str, signing_secret: str, user_id: str
    ) -> dict:
        payload = {
            "name": name,
            "region": settings.fly_region,
            "config": {
                "image": settings.machine_image,
                "guest": {"cpu_kind": "shared", "cpus": 1, "memory_mb": 2048},
                "env": {
                    "MACHINE_AGENT_SIGNING_SECRET": signing_secret,
                    "OWNER_USER_ID": user_id,
                    "BACKEND_URL": settings.backend_url or "",
                },
                "mounts": [{"volume": volume_id, "path": "/workspace"}],
                "services": [
                    {
                        "protocol": "tcp",
                        "internal_port": 8080,
                        "ports": [
                            {"port": 443, "handlers": ["tls", "http"]},
                            {"port": 80, "handlers": ["http"]},
                        ],
                    }
                ],
                "restart": {"policy": "on-failure", "max_retries": 3},
                # No other Machine may reach the Fly API from inside this
                # VM: the token that would let it is never injected.
            },
        }
        return await self._request(
            "POST", f"/apps/{settings.fly_app}/machines", json=payload
        )

    async def start_machine(self, machine_id: str) -> dict:
        return await self._request(
            "POST", f"/apps/{settings.fly_app}/machines/{machine_id}/start"
        )

    async def stop_machine(self, machine_id: str) -> dict:
        return await self._request(
            "POST", f"/apps/{settings.fly_app}/machines/{machine_id}/stop"
        )

    async def restart_machine(self, machine_id: str) -> dict:
        return await self._request(
            "POST", f"/apps/{settings.fly_app}/machines/{machine_id}/restart"
        )

    async def get_machine(self, machine_id: str) -> dict:
        return await self._request(
            "GET", f"/apps/{settings.fly_app}/machines/{machine_id}"
        )

    async def wait_for_state(
        self, machine_id: str, *, state: str = "started", timeout: int = 60
    ) -> dict:
        return await self._request(
            "GET",
            f"/apps/{settings.fly_app}/machines/{machine_id}/wait",
            params={"state": state, "timeout": timeout},
        )

    async def delete_machine(self, machine_id: str, *, force: bool = True) -> None:
        try:
            await self._request(
                "DELETE",
                f"/apps/{settings.fly_app}/machines/{machine_id}",
                params={"force": str(force).lower()},
            )
        except FlyAPIError as exc:
            if exc.status_code != 404:
                raise

    async def aclose(self) -> None:
        await self._client.aclose()
