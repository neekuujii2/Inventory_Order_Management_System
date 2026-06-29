from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    app_env: str = "development"
    log_level: str = "info"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    web_concurrency: int = 1
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800
    default_page_size: int = 25
    max_page_size: int = 100
    low_stock_threshold: int = 10
    dashboard_low_stock_limit: int = 10
    auto_seed: bool = False
    create_tables_on_startup: bool = False
    enable_gzip: bool = True
    gzip_minimum_size: int = 1000
    jwt_secret_key: str = "development-secret-key-change-me"
    jwt_access_token_expires_minutes: int = 30
    jwt_refresh_token_expires_days: int = 7

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
