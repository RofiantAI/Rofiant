"""Plan gating: free/pro/ultra tool access matches the website's tiers."""

import pytest
from fastapi import HTTPException

from app.services.plan_access import can_access_tool, normalize_plan, require_tool


def test_normalize_plan_defaults_to_free():
    assert normalize_plan(None) == "free"
    assert normalize_plan("") == "free"
    assert normalize_plan("nope") == "free"
    assert normalize_plan("ULTRA") == "ultra"


def test_tool_access_by_tier():
    assert can_access_tool("free", "chat")
    assert not can_access_tool("free", "voice")
    assert not can_access_tool("free", "workflows")

    assert can_access_tool("pro", "voice")
    assert not can_access_tool("pro", "workflows")

    assert can_access_tool("ultra", "workflows")


def test_require_tool_raises_403_with_upgrade_target():
    with pytest.raises(HTTPException) as exc:
        require_tool("free", "workflows")
    assert exc.value.status_code == 403
    assert "Ultra" in exc.value.detail

    require_tool("ultra", "workflows")  # no raise
