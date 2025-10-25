from fastapi import APIRouter, Query
from app.services.events_service import fetch_local_events

router = APIRouter()


@router.get("")
async def get_events(
    query: str = Query("San Francisco"),
    date_iso: str | None = Query(None)
):
    return await fetch_local_events(query=query, date_iso=date_iso)


