"""FastAPI application entrypoint for Pratikar.
Wires CORS, routers, structured logging, and consistent JSON error formats.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logging import structured_logger
from app.api.health import router as health_router
from app.api.analyses import router as analyses_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    structured_logger.log_event(
        event="server_started",
        stage="startup",
        details={"version": "1.0.0", "env": "production"},
    )
    yield


app = FastAPI(
    title="Pratikar API",
    description="Health insurance claim rejection contest engine for Geek2Code 2026 Grand Final.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ALLOWED_ORIGIN == "*" else settings.ALLOWED_ORIGIN.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (exact 7 endpoints in §5.4)
app.include_router(health_router)
app.include_router(analyses_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"code": "VALIDATION_ERROR", "message": str(exc)}},
    )

