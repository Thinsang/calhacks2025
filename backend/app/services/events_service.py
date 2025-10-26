import httpx
from app.core.config import settings


async def fetch_local_events(query: str, date_iso: str | None = None):
    # SerpApi Google Events integration
    if settings.serpapi_api_key:
        params = {
            "engine": "google_events",
            # Bias the search to SF and the date text when present
            "q": f"{query} San Francisco" if not date_iso else f"{query} San Francisco {date_iso[:10]}",
            "hl": "en",
            "gl": "us",
            "location": "San Francisco, California",
            "api_key": settings.serpapi_api_key,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get("https://serpapi.com/search.json", params=params)
                resp.raise_for_status()
                payload = resp.json()
                normalized = _normalize_serpapi_events(payload)
                return {"data": {"events": normalized}}
            except Exception as e:
                return {"error": str(e), "data": None}
    # Fallback mock
    return {
        "data": {
            "events": [
                {"title": "Street Food Festival", "distance_km": 1.2, "attendance": 5000},
                {"title": "Farmers Market", "distance_km": 0.8, "attendance": 1200},
            ]
        }
    }


def _normalize_serpapi_events(payload: dict):
    results = payload.get("events_results") or []
    normalized = []
    for ev in results:
        title = ev.get("title")
        date_when = ev.get("date") or ev.get("when")
        address = ev.get("address")
        link = ev.get("link")
        venue = (ev.get("venue") or {}).get("name") if isinstance(ev.get("venue"), dict) else ev.get("venue")
        # Estimate distance_km if lat/lng present
        lat = None
        lng = None
        geo = ev.get("geo") or {}
        try:
            lat = float(geo.get("lat")) if geo.get("lat") is not None else None
            lng = float(geo.get("lng")) if geo.get("lng") is not None else None
        except Exception:
            lat = lng = None
        if title:
            normalized.append(
                {
                    "title": title,
                    "when": date_when,
                    "address": address,
                    "venue": venue,
                    "link": link,
                    "latitude": lat,
                    "longitude": lng,
                }
            )
    return normalized


