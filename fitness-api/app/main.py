from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, workouts, exercises, metrics, nutrition, stats, coach
from app.config import settings
from app.database import engine, Base

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
app.include_router(nutrition.router, prefix="/nutrition", tags=["nutrition"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(coach.router, prefix="/coach", tags=["coach"])

@app.on_event("startup")
async def ensure_tables_exist() -> None:
    # Safety net for fresh production databases where Alembic revisions
    # may not yet exist/applied.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Welcome to Fitness Tracker API"}
