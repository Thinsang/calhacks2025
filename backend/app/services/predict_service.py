from __future__ import annotations

from app.models.prediction_model import get_model
from app.services.weather_service import fetch_weather_forecast
from app.services.events_service import fetch_local_events
from app.services.foot_traffic_service import fetch_popular_times
from app.core.config import settings
import asyncio
from math import exp
from math import radians, cos, sin, asin, sqrt


async def predict_score(latitude: float, longitude: float, date_iso: str | None, place_query: str):
    # Fetch all data concurrently, returning exceptions instead of raising them
    # Estimate time slot (dow/hour) from date_iso if present
    from datetime import datetime
    dow = None
    hour = None
    try:
        if date_iso:
            dt = datetime.fromisoformat(date_iso.replace("Z",""))
            dow = dt.weekday()  # 0=Mon..6=Sun; convert to 0=Sun..6=Sat
            dow = (dow + 1) % 7
            hour = dt.hour
    except Exception:
        pass

    results = await asyncio.gather(
        fetch_weather_forecast(latitude=latitude, longitude=longitude, date_iso=date_iso),
        fetch_local_events(query=place_query, date_iso=date_iso),
        fetch_popular_times(place_query=place_query, dow=dow, hour=hour),
        return_exceptions=True
    )
    weather, events, foot = results

    # Check for exceptions and use a default error dict if any occurred
    weather = weather if not isinstance(weather, Exception) else {"error": str(weather)}
    events = events if not isinstance(events, Exception) else {"error": str(events)}
    foot = foot if not isinstance(foot, Exception) else {"error": str(foot)}

    # Feature engineering is now safe from crashes
    historical_baseline = _slot_or_average(foot)
    weather_mod = _weather_modifier(weather)
    event_mod = _event_modifier(events, latitude, longitude)

    # Combine features via ML model when available; fall back to heuristic
    try:
        model = get_model()
        # Map modifiers to 0..1 feature ranges roughly
        weather_score = max(0.0, min(1.0, (weather_mod - 0.7) / 0.6))
        event_score = max(0.0, min(1.0, (event_mod - 1.0) / 0.5))
        hist_score = max(0.0, min(1.0, historical_baseline))
        score = model.predict(weather=weather_score, events=event_score, historical=hist_score)
    except Exception:
        # Heuristic: baseline is dominant, modifiers nudge it
        score = max(0.0, min(1.0, historical_baseline * weather_mod * event_mod))

    label = _label(score)

    return {
        "score": score * 100,
        "label": label,
        "features": {
            "historical_baseline": historical_baseline,
            "weather_modifier": weather_mod,
            "event_modifier": event_mod,
        },
        "raw": {"weather": weather, "events": events, "foot": foot},
    }


def _weather_modifier(payload) -> float:
    """
    Scores weather from 0.0 to 1.0 based on Open-Meteo data.
    Ideal: Temp between 15-25°C, low precipitation, minimal cloud cover.
    """
    data = (payload or {}).get("data", {}).get("hourly", {})
    if not data or payload.get("error"):
        return 1.0

    temps = data.get("temperature_2m", [])
    precips = data.get("precipitation", [])
    clouds = data.get("cloud_cover", [])
    
    if not temps:
        return 1.0

    # Consider daytime hours (e.g., 8am to 8pm)
    day_temps = temps[8:20]
    day_precips = precips[8:20]
    day_clouds = clouds[8:20]

    # Temperature score (ideal range 15-25°C)
    avg_temp = sum(day_temps) / len(day_temps) if day_temps else 18
    temp_score = 1.0 - min(abs(avg_temp - 20) / 10, 1.0) # Penalty for deviation from 20°C

    # Precipitation score (lower is better)
    total_precip = sum(day_precips) if day_precips else 0
    precip_score = 1.0 - min(total_precip / 5.0, 1.0) # Heavily penalize >5mm total rain

    # Cloud cover score (lower is better)
    avg_clouds = sum(day_clouds) / len(day_clouds) if day_clouds else 50
    cloud_score = 1.0 - (avg_clouds / 100.0)

    # Convert scores to multiplicative modifier centered at 1.0
    base = (temp_score * 0.5) + (precip_score * 0.35) + (cloud_score * 0.15)  # 0..1
    return 0.7 + 0.6 * base  # range roughly 0.7..1.3


def _event_modifier(payload, lat: float, lng: float) -> float:
    if (payload or {}).get("error"):
        return 1.0
    events = (payload or {}).get("data", {}).get("events", [])
    if not events:
        return 1.0

    # Estimate distance-based influence; if distance_km missing, default mild
    total_influence = 0.0
    for ev in events:
        dkm = ev.get("distance_km")
        if dkm is None:
            # If distance_km missing, try compute from coordinates
            ev_lat = ev.get("latitude")
            ev_lng = ev.get("longitude")
            if ev_lat is not None and ev_lng is not None and lat is not None and lng is not None:
                dkm = _haversine(lat, lng, ev_lat, ev_lng)
            else:
                continue
        # Influence decays with distance (~exp(-lambda * d))
        influence = exp(-1.2 * dkm)  # ~0.3 at 1km, tiny beyond 3km
        total_influence += influence

    # Convert to multiplicative modifier (capped)
    return min(1.5, 1.0 + total_influence)


def _haversine(lat1, lon1, lat2, lon2):
    # Earth radius in km
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c


def _slot_or_average(payload) -> float:
    if (payload or {}).get("error"):
        return 0.5
    series = (payload or {}).get("data", {}).get("series", [])
    if not series:
        return 0.5
    # If a single hour is returned (via dow/hour query), use that value
    if len(series) == 1:
        return min(1.0, max(0.0, (series[0].get("busyness", 0)) / 100.0))
    # Else average by hour
    avg = sum(pt.get("busyness", 0) for pt in series) / max(1, len(series))
    return min(1.0, avg / 100.0)


def _label(score: float) -> str:
    if score > 0.75: return "High"
    if score > 0.5: return "Medium"
    return "Low"


async def summarize_with_gemini(base: dict) -> str:
    # Safe extracts
    label = str(base.get("label", "N/A"))
    score = float(base.get("score", 0))
    raw = base.get("raw") or {}
    foot = raw.get("foot") or {}
    place_name = ((foot.get("data") or {}).get("place_name")) or "the selected area"
    hourly = ((raw.get("weather") or {}).get("data") or {}).get("hourly") or {}
    temps = hourly.get("temperature_2m") or [15]
    precs = hourly.get("precipitation") or [0]
    temp = temps[min(12, len(temps)-1)] if temps else 15
    precip = precs[min(12, len(precs)-1)] if precs else 0
    events_list = (((raw.get("events") or {}).get("data") or {}).get("events")) or []
    events_titles = ", ".join([e.get("title", "event") for e in events_list]) or "None reported"

    # If Gemini is not configured or import fails, produce a fallback summary
    def _fallback() -> str:
        feats = base.get("features", {})
        hist = float(feats.get("historical_baseline", 0.5))
        wmod = float(feats.get("weather_modifier", 1.0))
        emod = float(feats.get("event_modifier", 1.0))
        lines = []
        lines.append(f"Traffic is expected to be {label} ({score:.0f}/100) at {place_name}.")
        # Weather rationale
        if wmod < 0.9:
            lines.append("Weather may suppress foot traffic (chance of rain or less favorable conditions).")
        elif wmod > 1.1:
            lines.append("Favorable weather may increase activity.")
        # Event rationale
        if emod > 1.05:
            lines.append("Nearby events are likely to boost traffic.")
        elif not events_list:
            lines.append("No significant nearby events are scheduled.")
        # Baseline
        if hist >= 0.66:
            lines.append("Historically this time is busy in this area.")
        elif hist <= 0.33:
            lines.append("Historically this time is quieter in this area.")
        return " ".join(lines)

    if not settings.gemini_api_key:
        return _fallback()

    try:
        import google.generativeai as genai
    except ImportError:
        return _fallback()

    try:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            "You are a helpful assistant for a food truck owner in San Francisco. "
            "Provide a short 2-3 sentence summary that explains why the predicted traffic is at its level. "
            "Use weather and events as rationale when relevant.\n\n"
            f"Predicted Score: {score:.0f}/100 ({label}).\n"
            f"Location: {place_name}.\n"
            f"Weather snapshot: {temp}°C, {precip}mm precipitation (hourly).\n"
            f"Nearby events: {events_titles}."
        )
        response = await model.generate_content_async(prompt)
        return (response.text or "").strip() or _fallback()
    except Exception:
        return _fallback()


