from __future__ import annotations

from app.models.prediction_model import get_model
from app.services.weather_service import fetch_weather_forecast
from app.services.events_service import fetch_local_events
from app.services.foot_traffic_service import fetch_popular_times
from app.core.config import settings
import asyncio


async def predict_score(latitude: float, longitude: float, date_iso: str | None, place_query: str):
    # Fetch all data concurrently, returning exceptions instead of raising them
    results = await asyncio.gather(
        fetch_weather_forecast(latitude=latitude, longitude=longitude, date_iso=date_iso),
        fetch_local_events(query=place_query, date_iso=date_iso),
        fetch_popular_times(place_query=place_query),
        return_exceptions=True
    )
    weather, events, foot = results

    # Check for exceptions and use a default error dict if any occurred
    weather = weather if not isinstance(weather, Exception) else {"error": str(weather)}
    events = events if not isinstance(events, Exception) else {"error": str(events)}
    foot = foot if not isinstance(foot, Exception) else {"error": str(foot)}

    # Feature engineering is now safe from crashes
    weather_score = _score_weather(weather)
    event_score = _score_events(events)
    historical_score = _score_historical(foot)

    model = get_model()
    score = model.predict(weather=weather_score, events=event_score, historical=historical_score)
    label = _label(score)

    return {
        "score": score * 100,
        "label": label,
        "features": {
            "weather": weather_score,
            "events": event_score,
            "historical": historical_score,
        },
        "raw": {"weather": weather, "events": events, "foot": foot},
    }


def _score_weather(payload) -> float:
    """
    Scores weather from 0.0 to 1.0 based on Open-Meteo data.
    Ideal: Temp between 15-25°C, low precipitation, minimal cloud cover.
    """
    data = (payload or {}).get("data", {}).get("hourly", {})
    if not data or payload.get("error"):
        return 0.5

    temps = data.get("temperature_2m", [])
    precips = data.get("precipitation", [])
    clouds = data.get("cloud_cover", [])
    
    if not temps:
        return 0.5

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

    # Weighted average
    return (temp_score * 0.5) + (precip_score * 0.35) + (cloud_score * 0.15)


def _score_events(payload) -> float:
    """
    Scores events from 0.0 to 1.0. More events = higher score.
    Simple heuristic for now.
    """
    if (payload or {}).get("error"):
        return 0.3
    events = (payload or {}).get("data", {}).get("events", [])
    if not events:
        return 0.3

    # more or bigger events -> higher score
    # Capped at 1.0, base of 0.3, +0.1 per event up to 7 events.
    return min(1.0, 0.3 + 0.1 * len(events))


def _score_historical(payload) -> float:
    """
    Scores historical foot traffic from 0.0 to 1.0.
    Normalizes the average busyness score from populartimes.
    """
    if (payload or {}).get("error"):
        return 0.5
    series = (payload or {}).get("data", {}).get("series", [])
    if not series:
        return 0.5

    avg = sum(pt.get("busyness", 0) for pt in series) / max(1, len(series))
    # Normalize the 0-100 busyness score to a 0.0-1.0 scale
    return min(1.0, avg / 100.0)


def _label(score: float) -> str:
    if score > 0.75: return "High"
    if score > 0.5: return "Medium"
    return "Low"


async def summarize_with_gemini(base: dict) -> str:
    if not settings.gemini_api_key:
        return "LLM summary unavailable (no GEMINI_API_KEY)."
    
    try:
        import google.generativeai as genai
    except ImportError:
        return "Gemini library not installed. Please run: pip install google-generativeai"

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""
    You are a helpful assistant for a food truck owner in San Francisco.
    Based on the following data, provide a short, actionable summary (2-3 sentences) about the foot traffic prediction for a specific location.
    Be concise and friendly.

    Data:
    - Predicted Traffic Score: {base.get('score', 0):.0f}/100 ({base.get('label', 'N/A')})
    - Location Name: {base.get('raw', {}).get('foot', {}).get('data', {}).get('place_name', 'the selected area')}
    - Weather Summary: {base.get('raw', {}).get('weather', {}).get('data', {}).get('hourly', {}).get('temperature_2m', [15])[12]}°C, {base.get('raw', {}).get('weather', {}).get('data', {}).get('hourly', {}).get('precipitation', [0])[12]}mm rain.
    - Nearby Events: {', '.join([e.get('title', 'Unknown Event') for e in base.get('raw', {}).get('events', {}).get('data', {}).get('events', [])]) or 'None reported'}

    Example Output: "Foot traffic for this spot looks high on Saturday. This is likely due to the 'Street Food Festival' nearby and clear, sunny weather."
    """

    response = await model.generate_content_async(prompt)
    return response.text.strip()


