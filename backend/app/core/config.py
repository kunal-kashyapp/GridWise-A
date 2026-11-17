"""Application settings powered by pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """GridWise BEMS configuration.

    Values can be overridden via environment variables or a .env file.
    """

    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    DB_PATH: str = "gridwise.db"
    SIMULATION_INTERVAL: float = 5.0
    COMFORT_TEMP_MIN: float = 20.0
    COMFORT_TEMP_MAX: float = 26.0
    PEAK_DEMAND_THRESHOLD: float = 500.0

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings (singleton)."""
    return Settings()
