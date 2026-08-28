import asyncio
import base64
import logging
import math
import wave
from array import array
from io import BytesIO

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.auth import AuthContext, get_current_user
from app.config import settings
from app.services.plan_access import require_tool

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/transcribe", tags=["transcribe"])

# Gemini over Whisper here: it has a real free tier, no prepaid credits
# required, unlike OpenAI's audio/transcriptions endpoint.
GEMINI_MODEL = "gemini-3.6-flash"
TRANSCRIBE_PROMPT = (
    "Transcribe this audio exactly. Output only the spoken words, no commentary. "
    "If there is no clear speech, output nothing."
)

# Gemini hallucinates plausible-sounding text for silent/near-empty audio
# instead of returning nothing, so silence gets filtered out before it ever
# reaches the model. 16-bit PCM full scale is 32768; this is roughly -40dBFS.
SILENCE_RMS_THRESHOLD = 250


def _is_silent(wav_bytes: bytes) -> bool:
    with wave.open(BytesIO(wav_bytes), "rb") as wf:
        samples = array("h", wf.readframes(wf.getnframes()))
    if not samples:
        return True
    rms = math.sqrt(sum(s * s for s in samples) / len(samples))
    return rms < SILENCE_RMS_THRESHOLD


async def _transcode_to_wav(data: bytes) -> bytes:
    """Browsers record in whatever container their platform supports
    (WebKitGTK only does mp4/aac), and Gemini's inline_data only accepts
    wav/mp3/aiff/aac/ogg/flac. Normalizing through ffmpeg sidesteps guessing
    which container the client actually produced.

    ponytail: shells out to the system `ffmpeg` binary. Fine for local dev;
    the Railway deploy needs it added to the backend image before this works
    in production.
    """
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg",
        "-i", "pipe:0",
        "-f", "wav",
        "-ar", "16000",
        "-ac", "1",
        "pipe:1",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate(data)
    if proc.returncode != 0:
        raise RuntimeError(stderr.decode(errors="replace")[-500:])
    return stdout


@router.post("")
async def transcribe_audio(
    audio: UploadFile = File(...), auth: AuthContext = Depends(get_current_user)
):
    require_tool(auth.plan, "voice")

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Voice input isn't configured on this server")

    audio_bytes = await audio.read()
    logger.info(
        "Transcribe request: content_type=%s bytes=%d", audio.content_type, len(audio_bytes)
    )
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio captured")

    try:
        wav_bytes = await _transcode_to_wav(audio_bytes)
    except (OSError, RuntimeError) as exc:
        logger.warning("Audio transcode failed: %s", exc)
        raise HTTPException(status_code=502, detail="Couldn't process the recorded audio") from exc

    if _is_silent(wav_bytes):
        return {"text": ""}

    body = {
        "contents": [
            {
                "parts": [
                    {"text": TRANSCRIBE_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": "audio/wav",
                            "data": base64.b64encode(wav_bytes).decode(),
                        }
                    },
                ]
            }
        ]
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
            params={"key": settings.gemini_api_key},
            json=body,
        )
    if resp.status_code != 200:
        logger.warning("Gemini transcription failed (%s): %s", resp.status_code, resp.text)
        raise HTTPException(status_code=502, detail=f"Transcription failed: {resp.text}")

    data = resp.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise HTTPException(status_code=502, detail="Transcription returned no text") from exc

    return {"text": text.strip()}
