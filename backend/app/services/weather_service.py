import httpx
from app.core.config import settings


async def fetch_weather_forecast(latitude: float, longitude: float, date_iso: str | None = None):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,precipitation,cloud_cover,windspeed_10m",
        "timezone": "America/Los_Angeles",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.get(settings.open_meteo_base, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            return {"error": str(e), "data": None}
    return {"data": data}


