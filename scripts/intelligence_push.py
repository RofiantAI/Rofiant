"""
Push intelligence events from your urban data program to Rofiant.

Install: pip install requests

Set env vars:
  ROFIANT_URL=https://your-rofiant-domain.com
  ROFIANT_API_KEY=your-ingest-key          # set INTELLIGENCE_INGEST_KEY in Vercel env
  ROFIANT_AGENCY_ID=your-agency-uuid
"""

import os
import requests
from typing import Optional

ROFIANT_URL = os.environ["ROFIANT_URL"]
ROFIANT_API_KEY = os.environ["ROFIANT_API_KEY"]
ROFIANT_AGENCY_ID = os.environ["ROFIANT_AGENCY_ID"]


def push_event(
    summary: str,
    severity: str = "low",          # low | medium | high | critical
    source: str = "traffic_cam",
    source_id: Optional[str] = None,
    event_type: str = "observation", # observation | incident | anomaly
    location_label: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    confidence: Optional[float] = None,  # 0.0 – 1.0
    image_url: Optional[str] = None,
    raw_data: Optional[dict] = None,
) -> dict:
    payload = {
        "agency_id": ROFIANT_AGENCY_ID,
        "summary": summary,
        "severity": severity,
        "source": source,
        "source_id": source_id,
        "event_type": event_type,
        "location_label": location_label,
        "lat": lat,
        "lng": lng,
        "confidence": confidence,
        "image_url": image_url,
        "raw_data": raw_data,
    }
    resp = requests.post(
        f"{ROFIANT_URL}/api/intelligence",
        json=payload,
        headers={"x-api-key": ROFIANT_API_KEY},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def push_batch(events: list[dict]) -> dict:
    """Push multiple events in one request."""
    rows = [{"agency_id": ROFIANT_AGENCY_ID, **e} for e in events]
    resp = requests.post(
        f"{ROFIANT_URL}/api/intelligence",
        json=rows,
        headers={"x-api-key": ROFIANT_API_KEY},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


# --- Example usage ---
if __name__ == "__main__":
    result = push_event(
        summary="Unusual crowd density detected at intersection — 3x above baseline",
        severity="medium",
        source="traffic_cam",
        source_id="CAM-042",
        event_type="anomaly",
        location_label="Main St & 5th Ave",
        lat=45.4215,
        lng=-75.6972,
        confidence=0.87,
        raw_data={"density": 312, "baseline": 104, "frame_ts": "2026-06-26T14:30:00Z"},
    )
    print(result)
