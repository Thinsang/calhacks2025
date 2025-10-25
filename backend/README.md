# SF Food Truck Spot Finder - Backend

Setup:

```
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Env (optional):

```
CORS_ALLOW_ORIGINS=http://localhost:3000
SERPAPI_API_KEY=
EVENTBRITE_TOKEN=
OUTSCRAPER_API_KEY=
GEMINI_API_KEY=
```

Endpoints:
- /api/weather
- /api/events
- /api/foot-traffic
- /api/predict
- /api/predict-llm


