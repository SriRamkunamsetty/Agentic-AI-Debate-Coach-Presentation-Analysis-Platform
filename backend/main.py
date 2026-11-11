import html
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from config import settings
from database import Base, SessionLocal, engine
from migrations import run_migrations
from middleware import InMemoryRateLimitMiddleware
import models

from routers import (
    argument_analysis,
    auth,
    coaching,
    counterarguments,
    dashboards,
    fallacy_detection,
    feedback,
    notifications,
    presentation_analysis,
    reports,
    scoring,
    sessions,
    simulation,
    workflows,
    arena,
)


settings.validate()
Base.metadata.create_all(bind=engine)
run_migrations(engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.add_middleware(InMemoryRateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https://(logos-ai|agentic-ai-debate-coach)[a-zA-Z0-9-]*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(argument_analysis.router)
app.include_router(fallacy_detection.router)
app.include_router(counterarguments.router)
app.include_router(presentation_analysis.router)
app.include_router(simulation.router)
app.include_router(scoring.router)
app.include_router(coaching.router)
app.include_router(dashboards.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(feedback.router)
app.include_router(workflows.router)
app.include_router(arena.router)

# Prometheus Observability Metric Scraper
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    if settings.PROMETHEUS_METRICS_ENABLED:
        Instrumentator().instrument(app).expose(app, endpoint="/metrics", tags=["Operations"])
except Exception:
    pass


@app.get("/", include_in_schema=False)
def root(request: Request):
    accept_header = request.headers.get("accept", "")
    payload = {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "frontend_url": "https://logos-ai-tau.vercel.app",
        "docs_url": "/docs",
        "health_url": "/health",
        "metrics_url": "/metrics",
    }
    if "text/html" in accept_header:
        safe_title = html.escape(settings.PROJECT_NAME)
        safe_version = html.escape(settings.VERSION)
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{safe_title} | API Gateway</title>
  <style>
    body {{
      margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(circle at top left, #1e1b4b, #0b0f19 60%);
      color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    }}
    .card {{
      background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 20px;
      padding: 2.5rem; max-width: 620px; width: 90%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
    }}
    .badge {{
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;
    }}
    h1 {{ font-size: 1.6rem; margin: 1rem 0 0.5rem; font-weight: 800; }}
    p {{ color: #94a3b8; line-height: 1.6; font-size: 0.95rem; margin-bottom: 1.8rem; }}
    .actions {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }}
    .btn {{
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.85rem 1.2rem; border-radius: 12px; font-weight: 700; text-decoration: none;
      font-size: 0.9rem; transition: transform 0.15s ease;
    }}
    .btn:hover {{ transform: translateY(-2px); }}
    .btn-primary {{ background: linear-gradient(135deg, #4f46e5, #ec4899); color: #fff; grid-column: span 2; }}
    .btn-secondary {{ background: rgba(255,255,255,0.08); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.12); }}
    @media (max-width: 500px) {{ .actions {{ grid-template-columns: 1fr; }} .btn-primary {{ grid-column: span 1; }} }}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● API GATEWAY ONLINE · v{safe_version}</div>
    <h1>{safe_title}</h1>
    <p>
      You are viewing the backend FastAPI microservice gateway (<code>logos-ai-api.vercel.app</code>).
      To interact with the full UI (Tournament Arena, Toulmin Visualizer, Rhetorical Drills &amp; AI Sparring),
      launch the web application below.
    </p>
    <div class="actions">
      <a class="btn btn-primary" href="https://logos-ai-tau.vercel.app">🚀 Launch LOGOS.AI Web Application</a>
      <a class="btn btn-secondary" href="/docs">📚 Interactive Swagger Docs</a>
      <a class="btn btn-secondary" href="/health">🩺 System Health Check</a>
      <a class="btn btn-secondary" href="/metrics">📊 Prometheus Metrics</a>
      <a class="btn btn-secondary" href="/redoc">📖 ReDoc Reference</a>
    </div>
  </div>
</body>
</html>"""
        return HTMLResponse(content=html_content)
    return JSONResponse(content=payload)


@app.get("/health", tags=["Operations"])
def health_check():
    started = time.perf_counter()
    db_status = "healthy"
    try:
        db = SessionLocal()
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "unavailable"
    latency_ms = round((time.perf_counter() - started) * 1000, 2)
    overall = "healthy" if db_status == "healthy" else "degraded"
    return {
        "status": overall,
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "latency_ms": latency_ms,
        "ai_provider": settings.AI_PROVIDER,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
