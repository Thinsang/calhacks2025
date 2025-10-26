from app.core.config import settings
from typing import List, Optional
import httpx
import asyncio


async def fetch_popular_times(
    place_query: Optional[str] = None,
    sw_lat: Optional[float] = None,
    sw_lng: Optional[float] = None,
    ne_lat: Optional[float] = None,
    ne_lng: Optional[float] = None,
    types: Optional[List[str]] = None,
):
    """Fetches popular times data.

    Primary source: OutScraper (no Google Places dependency).
    - If a text `place_query` is provided, we ask OutScraper for a single place
      and extract its weekly "popular_times" histogram, averaging to 24h series.
    - Bounds mode remains mock for now (OutScraper doesn't provide a simple free
      bounding-box endpoint); UI still works with mock bubbles.
    """
    if settings.outscraper_api_key:
        try:
            if place_query:
                place = await _outscraper_place_by_query(place_query)
                if not place:
                    return {"error": f"Place '{place_query}' not found.", "data": None}
                series = _series_from_outscraper(place)
                return {"data": {"series": series, "place_name": place.get("name"), "source": "outscraper_query"}}

            # Bounds mode – keep lightweight mock dataset for map density
            if sw_lat is not None and sw_lng is not None and ne_lat is not None and ne_lng is not None:
                return {"data": {"places": _get_mock_places(), "source": "mock_bounds"}}
        except Exception as e:
            return {"error": str(e), "data": None}

    # Fallback when no API key – use mock
    return {"data": {"places": _get_mock_places(), "source": "mock"}}

def _process_place(place: dict):
    series = _series_from_place(place)
    avg_busyness = sum(s["busyness"] for s in series) / len(series) if series else 0
    return {
        "name": place.get("name"),
        "coordinates": place.get("coordinates"),
        "avg_busyness": avg_busyness,
        "types": place.get("types")
    }

def _series_from_place(place: dict):
    week = place.get("populartimes") or []
    if not week:
        return []
    
    total_data = [0] * 24
    days_with_data = 0
    for day in week:
        data = day.get("data")
        if data and len(data) == 24:
            days_with_data += 1
            for i in range(24):
                total_data[i] += data[i]

    if days_with_data == 0:
        return []
        
    avg_data = [round(x / days_with_data) for x in total_data]
    return [{"hour": i, "busyness": avg_data[i]} for i in range(24)]


async def _outscraper_place_by_query(query: str) -> Optional[dict]:
    """Query OutScraper for a single place with popular times.

    Notes:
    - OutScraper Cloud docs: https://app.outscraper.cloud/api-docs
    - We request 1 result with popular_times included.
    - API routes evolve; this call supports common endpoints and payloads.
    """
    headers = {
        "x-api-key": settings.outscraper_api_key or "",
        "accept": "application/json",
        "content-type": "application/json",
    }
    # Try JSON POST payload variant first
    payload = {
        "queries": [
            {
                "query": query,
                "limit": 1,
                "fields": ["name", "popular_times", "coordinates"],
            }
        ]
    }

    async with httpx.AsyncClient(timeout=30) as client:
        # Preferred cloud endpoint
        endpoints = [
            "https://app.outscraper.cloud/api/google-maps/places",
            "https://api.outscraper.com/google-maps/places",
        ]
        for url in endpoints:
            try:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    # Expected shape: { data: [ { name, popular_times, coordinates, ... } ] }
                    items = (
                        (data or {}).get("data")
                        or (data or {}).get("results")
                        or (data or {}).get("items")
                        or []
                    )
                    if items:
                        return items[0]
            except Exception:
                continue

    return None


def _series_from_outscraper(place: dict):
    """Normalize OutScraper popular_times structure into a 24-hour series.

    OutScraper typically returns weekly histograms by weekday with 24 buckets.
    We average across week days to a single 24-hour profile for simplicity.
    """
    week = (place or {}).get("popular_times") or (place or {}).get("popularTimes") or {}
    if not week:
        return []

    # Aggregate by hour
    total = [0] * 24
    days = 0
    # week might be {"Monday": [..24..], ...}
    for _, hours in (week.items() if isinstance(week, dict) else []):
        if isinstance(hours, list) and len(hours) == 24:
            days += 1
            for i in range(24):
                try:
                    total[i] += int(hours[i])
                except Exception:
                    pass

    if days == 0:
        return []
    avg = [round(x / days) for x in total]
    return [{"hour": i, "busyness": avg[i]} for i in range(24)]

def _get_mock_places():
    return [
        {"name": "Mock Cafe", "coordinates": {"lat": 37.7749, "lng": -122.4194}, "avg_busyness": 80},
        {"name": "Mock Restaurant", "coordinates": {"lat": 37.7759, "lng": -122.4294}, "avg_busyness": 55},
        {"name": "Mock Park", "coordinates": {"lat": 37.7739, "lng": -122.4154}, "avg_busyness": 25},
        {"name": "Mock Bar", "coordinates": {"lat": 37.79, "lng": -122.41}, "avg_busyness": 90},
    ]


