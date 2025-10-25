from fastapi import APIRouter, Query
from app.services.predict_service import predict_score

router = APIRouter()


@router.get("")
async def get_prediction(
    latitude: float = Query(37.7749),
    longitude: float = Query(-122.4194),
    date_iso: str | None = Query(None),
    place_query: str = Query("San Francisco")
):
    result = await predict_score(
        latitude=latitude, longitude=longitude, date_iso=date_iso, place_query=place_query
    )
    return result


