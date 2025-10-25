from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.weather import router as weather_router
from app.api.routes.events import router as events_router
from app.api.routes.foot_traffic import router as foot_router
from app.api.routes.predict import router as predict_router
from app.api.routes.predict_llm import router as predict_llm_router


app = FastAPI(title="SF Food Truck Spot Finder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_router, prefix="/api/weather", tags=["weather"])
app.include_router(events_router, prefix="/api/events", tags=["events"])
app.include_router(foot_router, prefix="/api/foot-traffic", tags=["foot-traffic"])
app.include_router(predict_router, prefix="/api/predict", tags=["predict"])
app.include_router(predict_llm_router, prefix="/api/predict-llm", tags=["predict-llm"])


@app.get("/api/health")
def health():
    return {"status": "ok"}


