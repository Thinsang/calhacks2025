from app.core.config import settings
from typing import List, Optional
import asyncio
import httpx


async def fetch_popular_times(
    place_query: Optional[str] = None,
    sw_lat: Optional[float] = None,
    sw_lng: Optional[float] = None,
    ne_lat: Optional[float] = None,
    ne_lng: Optional[float] = None,
    types: Optional[List[str]] = None,
):
    if settings.google_maps_api_key:
        try:
            import populartimes
        except ImportError:
            return {"error": "populartimes library not installed", "data": None}

        try:
            loop = asyncio.get_running_loop()

            if place_query:
                place_id = await _find_place_id(place_query)
                if not place_id:
                    return {"error": f"Place '{place_query}' not found.", "data": None}
                
                place = await loop.run_in_executor(
                    None, populartimes.get_id, settings.google_maps_api_key, place_id
                )
                series = _series_from_place(place)
                return {"data": {"series": series, "place_name": place.get("name"), "source": "populartimes_id"}}

            if sw_lat is not None and sw_lng is not None and ne_lat is not None and ne_lng is not None:
                bound_lower = (sw_lat, sw_lng)
                bound_upper = (ne_lat, ne_lng)
                pt_types = types or ["restaurant", "cafe", "food", "tourist_attraction", "store", "bar"]
                
                results = await loop.run_in_executor(
                    None,
                    lambda: populartimes.get(
                        settings.google_maps_api_key,
                        pt_types,
                        bound_lower,
                        bound_upper,
                        n_threads=40,
                        radius=150,
                        all_places=False,
                    ),
                )
                
                places = [_process_place(p) for p in results if p.get("populartimes")]
                return {"data": {"places": places, "source": "populartimes_bounds"}}
        except Exception as e:
            return {"error": str(e), "data": None}

    return {"data": {"places": _get_mock_places(), "source": "mock"}}


async def _find_place_id(query: str) -> Optional[str]:
    if not query or not settings.google_maps_api_key:
        return None
    if query.startswith("placeid:"):
        return query.split(":", 1)[1]

    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    params = {
        "input": f"{query}, San Francisco",
        "inputtype": "textquery",
        "fields": "place_id,name",
        "key": settings.google_maps_api_key,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        data = resp.json()
        candidates = data.get("candidates")
        if candidates:
            return candidates[0].get("place_id")
        return None

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

def _get_mock_places():
    return [
        {"name": "Mock Cafe", "coordinates": {"lat": 37.7749, "lng": -122.4194}, "avg_busyness": 80},
        {"name": "Mock Restaurant", "coordinates": {"lat": 37.7759, "lng": -122.4294}, "avg_busyness": 55},
        {"name": "Mock Park", "coordinates": {"lat": 37.7739, "lng": -122.4154}, "avg_busyness": 25},
        {"name": "Mock Bar", "coordinates": {"lat": 37.79, "lng": -122.41}, "avg_busyness": 90},
    ]


