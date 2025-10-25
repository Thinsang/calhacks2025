# Foot Traffic Finder

A modern, data-driven web application that provides a live and predictive foot traffic map of San Francisco, designed to help food truck owners find optimal locations.

## Core Features

-   **Live & Predictive Map:** A full-screen, interactive Mapbox map visualizing real-time and predicted foot traffic across San Francisco.
-   **Dynamic Visualization:** The map displays data as color-coded circles for individual locations, indicating busyness levels (e.g., "Not Busy," "Moderate," "Busy").
-   **Interactive Popups & Legend:** Hover over a location to see its name and busyness score. A clear legend explains the color-coding.
-   **Prediction Engine:** Select a location and a future date to receive a foot traffic prediction based on historical data, weather, and local events.
-   **AI-Powered Summaries:** An integrated Gemini model provides a concise, human-readable summary of the prediction.

## Tech Stack

-   **Frontend:** Next.js (TypeScript), Tailwind CSS, Radix UI, `framer-motion`, Mapbox GL JS, React Query.
-   **Backend:** Python (FastAPI), Scikit-learn, Google Gemini.

## Data Sources

-   **Foot Traffic:** Google Maps "Popular Times" data via the `populartimes` library.
-   **Events:** Google Events API via SerpApi.
-   **Weather:** Open-Meteo API.

## Quickstart

### 1. Backend Setup

First, set up and run the FastAPI server.

```powershell
# 1. Create a virtual environment (only once)
python -m venv .venv

# 2. Activate it (run this every time you open a new terminal)
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Set up environment variables
# Copy `backend/ENV.example` to `backend/.env` and fill in your API keys:
# GOOGLE_MAPS_API_KEY (required for foot traffic)
# SERPAPI_API_KEY (required for events)
# GEMINI_API_KEY (required for AI summaries)

# 5. Run the server
uvicorn app.main:app --reload --port 8001 --app-dir backend
```

The backend will be running at `http://localhost:8001`.

### 2. Frontend Setup

In a **new terminal**, set up and run the Next.js frontend.

```powershell
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Copy `frontend/ENV.example` to `frontend/.env.local` and add your Mapbox token:
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_MAPBOX_TOKEN_HERE
# NEXT_PUBLIC_API_BASE=http://localhost:8001

# 4. Run the development server
npx next dev -p 3001
```

The application will be accessible at `http://localhost:3001`.

