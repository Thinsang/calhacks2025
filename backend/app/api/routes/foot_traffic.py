from fastapi import APIRouter, Query
from typing import List
from app.services.foot_traffic_service import fetch_popular_times

router = APIRouter()


@router.get("")
async def get_foot_traffic(
    place_query: str | None = Query(None, description="A specific text query for a single place prediction"),
    sw_lat: float | None = Query(None, description="South-West latitude of map bounds for area search"),
    sw_lng: float | None = Query(None, description="South-West longitude of map bounds for area search"),
    ne_lat: float | None = Query(None, description="North-East latitude of map bounds for area search"),
    ne_lng: float | None = Query(None, description="North-East longitude of map bounds for area search"),
    types: List[str] | None = Query(None, description="Google Places types for bounds search"),
):
    return await fetch_popular_times(
        place_query=place_query,
        sw_lat=sw_lat,
        sw_lng=sw_lng,
        ne_lat=ne_lat,
        ne_lng=ne_lng,
        types=types,
    )


