from fastapi import APIRouter, Query
from app.services.weather_service import fetch_weather_forecast

router = APIRouter()


@router.get("")
async def get_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    date_iso: str | None = Query(None)
):
    return await fetch_weather_forecast(latitude=latitude, longitude=longitude, date_iso=date_iso)


