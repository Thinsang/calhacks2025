from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator
from typing import List, Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    # Use a raw string env to avoid DotEnv JSON parsing errors for List[str]
    cors_allow_origins_raw: Optional[str] = None
    cors_allow_origins: List[str] = ["http://localhost:3000"]
    open_meteo_base: str = "https://api.open-meteo.com/v1/forecast"
    serpapi_api_key: str | None = None
    eventbrite_token: str | None = None
    outscraper_api_key: str | None = None
    gemini_api_key: str | None = None
    google_maps_api_key: str | None = None

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def _parse_list_or_string(cls, v):
        # Accept plain string (comma-separated) or JSON array
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return []
            if s.startswith("[") and s.endswith("]"):
                try:
                    import json
                    return json.loads(s)
                except Exception:
                    pass
            return [p.strip() for p in s.split(",") if p.strip()]
        return v

    @model_validator(mode="after")
    def _compute_origins(self):
        raw = self.cors_allow_origins_raw
        # Prefer explicit RAW env var, otherwise allow common localhost ports
        if isinstance(raw, str) and raw.strip():
            v = raw.strip()
            try:
                if v.startswith("[") and v.endswith("]"):
                    import json
                    self.cors_allow_origins = json.loads(v)
                else:
                    self.cors_allow_origins = [s.strip() for s in v.split(",") if s.strip()]
            except Exception:
                # keep default on parse issues
                pass
        else:
            # Ensure typical dev ports are allowed by default
            defaults = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"}
            self.cors_allow_origins = list({*self.cors_allow_origins, *defaults})
        # Never allow wildcard when credentials may be used
        try:
            self.cors_allow_origins = [o for o in self.cors_allow_origins if o and o != "*"]
        except Exception:
            pass
        return self


settings = Settings()


