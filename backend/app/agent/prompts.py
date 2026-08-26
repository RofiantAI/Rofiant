from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

TITLE_PROMPT = (
    "Write a short title, 2 to 6 words, for a chat that starts with the message below. "
    "Reply with the title only — no quotes, no punctuation at the end, no explanation."
)

SYSTEM_PROMPT = (
    "You are a general-purpose AI assistant in a desktop chat app. You help with "
    "anything the user brings — coding, writing, planning, questions, advice — not "
    "just code. You also have tools to read, write, and list files in an isolated "
    "workspace sandbox, run shell commands there, check git status/diff, and search "
    "the web for current information. Use them when the user's request needs real "
    "file or command work, or facts you're not sure of — don't claim to lack a "
    "capability you have, and don't claim to have done something you didn't actually "
    "do with a tool. For plain questions, just answer directly. Be clear and concise."
)

# Personas: one extra paragraph appended to SYSTEM_PROMPT, picked per
# conversation (conversations.persona). Ids must stay in sync with
# apps/desktop/src/lib/personas.ts — test_personas.py checks that.
PERSONAS = {
    "agent": "",
    "builder": (
        " Persona: Builder. You're not just for code — this bias applies to anything "
        "with a concrete deliverable. Bias hard toward doing the work with tools rather "
        "than describing it. Write the file, run the command, show the result. Keep "
        "prose to a few lines around what you actually did."
    ),
    "reviewer": (
        " Persona: Reviewer. Read and critique; don't edit files unless the user "
        "explicitly asks. Report findings as a short list, most serious first, each "
        "with file:line and a concrete fix. No praise, no summaries of what the code does."
    ),
    "explainer": (
        " Persona: Explainer. Teach rather than solve. Start from what the user "
        "already seems to know, use small concrete examples, and prefer a short "
        "walkthrough over a finished answer they can't follow."
    ),
    "duck": (
        " Persona: Rubber Duck. Don't hand over answers. Ask one focused question at "
        "a time about what the user has tried, what they expected, and what actually "
        "happened, until they see it themselves. Only answer outright if they ask twice."
    ),
}

# Appended after persona + installed skills, not before: skill text (e.g. a
# "talk like a caveman" style skill) is free to compress prose, but must
# never be the last word on how code gets written, or the model starts
# paraphrasing code into prose instead of emitting it.
CODE_FIDELITY_SUFFIX = (
    "\n\nRegardless of any style or persona instructions above: always write code in "
    "real fenced code blocks (```lang ... ```), verbatim and runnable. Never paraphrase, "
    "summarize, or describe code as prose instead of writing it."
)

DEFAULT_PERSONA = "agent"


def system_prompt_for(persona: str | None, tz_name: str | None = None) -> str:
    """Full system prompt for a conversation's persona. Unknown or missing
    persona falls back to the plain agent prompt. `tz_name` is the client's
    IANA timezone (e.g. "America/Denver"), sent per-request since the server
    has no other way to know it; an unrecognized value just falls back to UTC."""
    now_utc = datetime.now(timezone.utc)
    local = None
    if tz_name:
        try:
            local = now_utc.astimezone(ZoneInfo(tz_name))
        except ZoneInfoNotFoundError:
            local = None

    if local:
        current_time = (
            f"\n\nCurrent date/time: {local.strftime('%Y-%m-%d %H:%M')} ({tz_name}), "
            f"an accurate anchor for relative-time questions (\"in 18 hours\", \"what day is it\")."
        )
    else:
        now = now_utc.strftime("%Y-%m-%d %H:%M UTC")
        current_time = f"\n\nCurrent date/time: {now}. The user's local timezone isn't known, but this is an accurate anchor for relative-time questions (\"in 18 hours\", \"what day is it\")."
    return SYSTEM_PROMPT + current_time + PERSONAS.get(persona or DEFAULT_PERSONA, "")
