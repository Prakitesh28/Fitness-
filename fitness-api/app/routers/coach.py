from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_current_active_user
from app.database import get_db
from app.schemas.coach import CoachAnalysis
from app.services.coach import CoachEngine
from app.models import User

router = APIRouter()
coach_cache: dict[int, dict[str, object]] = {}
CACHE_TTL_SECONDS = 3600

@router.get('/analyse', response_model=CoachAnalysis)
async def analyse_coach(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    cached = coach_cache.get(current_user.id)
    now = datetime.utcnow().timestamp()
    if cached and now - cached['timestamp'] < CACHE_TTL_SECONDS:
        return cached['result']

    analysis = await CoachEngine(db).analyse(current_user.id)
    coach_cache[current_user.id] = {
        'timestamp': now,
        'result': analysis
    }
    return analysis

