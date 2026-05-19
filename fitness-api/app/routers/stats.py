from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.database import get_db
from app.models import User
from app.models import WorkoutSession, SessionExercise, Set, Exercise, BodyMetric
from app.dependencies import get_current_active_user
from app.services.stats import (
    get_weekly_volume,
    get_estimated_1rm,
    get_workout_streak,
    get_muscle_group_frequency,
    get_progressive_overload
)
from app.schemas.stats import (
    WeeklyVolumeItem,
    Estimated1RMResponse,
    WorkoutStreakResponse,
    MuscleGroupFrequencyItem,
    ProgressiveOverloadWeek
)

router = APIRouter()

@router.get("/volume")
async def get_volume_per_muscle_group_per_week(
    week: str = Query(..., description="Week in YYYY-WW format"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Parse week string to get year and week number
    try:
        year, week_num = map(int, week.split('-'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid week format. Use YYYY-WW")

    # Calculate start and end date of the week (Monday to Sunday)
    # Using ISO week: Monday is day 1
    d = datetime.strptime(f'{year}-{week_num}-1', '%G-%V-%u').date()
    start_date = d
    end_date = d + timedelta(days=6)

    # Query to get total volume (weight_kg * reps) per muscle group for the given week
    query = select(
        Exercise.muscle_group,
        func.sum(Set.weight_kg * Set.reps).label('total_volume')
    ).select_from(Set).join(SessionExercise).join(Exercise).join(WorkoutSession).where(
        and_(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.date >= start_date,
            WorkoutSession.date <= end_date
        )
    ).group_by(Exercise.muscle_group)

    result = await db.execute(query)
    volume_data = result.all()

    # Format response
    volume_by_muscle_group = {str(muscle_group): float(total_volume) for muscle_group, total_volume in volume_data}
    return volume_by_muscle_group

@router.get("/weekly-volume", response_model=List[WeeklyVolumeItem])
async def weekly_volume(
    weeks: int = Query(8, ge=1, le=52),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_weekly_volume(db, current_user.id, weeks)

@router.get("/bodyweight")
async def get_bodyweight_trend(
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    # Get body metrics for the user in the date range, ordered by date
    query = select(BodyMetric.date, BodyMetric.weight_kg).where(
        and_(
            BodyMetric.user_id == current_user.id,
            BodyMetric.date >= start_date,
            BodyMetric.date <= end_date
        )
    ).order_by(BodyMetric.date)

    result = await db.execute(query)
    metrics = result.all()

    # Format as list of objects with date and weight_kg
    trend = [{"date": str(m.date), "weight_kg": float(m.weight_kg)} for m in metrics]
    return trend

@router.get("/streak")
async def get_workout_streak(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Get all workout sessions for the user, ordered by date descending
    query = select(WorkoutSession.date).where(
        WorkoutSession.user_id == current_user.id
    ).order_by(WorkoutSession.date.desc())

    result = await db.execute(query)
    sessions = result.scalars().all()

    if not sessions:
        return {"streak": 0}

    # Calculate streak: consecutive days from today backwards
    streak = 0
    today = date.today()
    # We expect that the user works out at least once a day to maintain streak.
    # We'll check for consecutive days starting from today and going backwards.
    # But note: the user might not have worked out today, so we start from the most recent workout.
    # We want the current streak, meaning if the last workout was today, streak at least 1.
    # We'll convert the list of dates to a set for O(1) lookups.
    session_dates = set(sessions)

    # Start from today and go backwards until we break the streak
    current_day = today
    while current_day in session_dates:
        streak += 1
        current_day -= timedelta(days=1)

    return {"streak": streak}

@router.get("/streak-summary", response_model=WorkoutStreakResponse)
async def get_workout_streak_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_workout_streak(db, current_user.id)

@router.get("/estimated-1rm", response_model=Estimated1RMResponse)
async def estimated_1rm(
    exercise_id: int = Query(..., description="Exercise id"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await get_estimated_1rm(db, current_user.id, exercise_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No sets found for this exercise in the last 30 days")
    return result

@router.get("/muscle-frequency", response_model=List[MuscleGroupFrequencyItem])
async def muscle_group_frequency(
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_muscle_group_frequency(db, current_user.id, days)

@router.get("/progressive-overload", response_model=List[ProgressiveOverloadWeek])
async def progressive_overload(
    exercise_id: int = Query(..., description="Exercise id"),
    weeks: int = Query(8, ge=1, le=52),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_progressive_overload(db, current_user.id, exercise_id, weeks)

