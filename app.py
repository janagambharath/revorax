"""Railway entry point for the Revorax marketing site.

The public site is intentionally static, while this FastAPI app gives Railway a
long-running Python process, a health check, and a clear place to add the
Renewal Desk API as product features are connected.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles


ROOT_DIR = Path(__file__).resolve().parent
LANDING_DIR = ROOT_DIR / "renewal-desk"

app = FastAPI(
    title="Revorax",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


@app.get("/health", include_in_schema=False)
def health_check() -> dict[str, str]:
    """Railway health check endpoint."""
    return {"status": "ok"}


@app.get("/api/v1/status", include_in_schema=False)
def api_status() -> dict[str, str]:
    """Small API foundation for future Renewal Desk product endpoints."""
    return {"service": "renewal-desk", "status": "online"}


@app.get("/", include_in_schema=False)
def revorax_home() -> FileResponse:
    """Serve the Revorax product index."""
    return FileResponse(ROOT_DIR / "index.html")


@app.get("/renewal-desk", include_in_schema=False)
def renewal_desk_home() -> RedirectResponse:
    """Keep the canonical landing-page URL working without a trailing slash."""
    return RedirectResponse(url="/renewal-desk/", status_code=307)


app.mount(
    "/renewal-desk",
    StaticFiles(directory=LANDING_DIR, html=True),
    name="renewal-desk",
)
