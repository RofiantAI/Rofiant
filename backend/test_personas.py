"""Persona prompts: fallback behaviour, and that the desktop picker's bot ids
still match the backend's prompt table (two files, two languages, one list)."""

import re
from pathlib import Path

from app.agent.prompts import DEFAULT_PERSONA, PERSONAS, SYSTEM_PROMPT, system_prompt_for

PERSONAS_TS = Path(__file__).parent.parent / "apps/desktop/src/lib/personas.ts"


def test_fallbacks_and_suffixes():
    fallback = system_prompt_for(None)
    assert fallback == system_prompt_for("nope") == system_prompt_for(DEFAULT_PERSONA)
    assert fallback.startswith(SYSTEM_PROMPT)
    for persona in PERSONAS:
        prompt = system_prompt_for(persona)
        assert prompt.startswith(SYSTEM_PROMPT)
        assert persona == DEFAULT_PERSONA or len(prompt) > len(fallback)

def test_ids_match_desktop_picker():
    ts_ids = set(re.findall(r'^\s*id: "([^"]+)",', PERSONAS_TS.read_text(), re.MULTILINE))
    assert ts_ids == set(PERSONAS), f"backend {set(PERSONAS)} != desktop {ts_ids}"


if __name__ == "__main__":
    test_fallbacks_and_suffixes()
    test_ids_match_desktop_picker()
    print("ok")
