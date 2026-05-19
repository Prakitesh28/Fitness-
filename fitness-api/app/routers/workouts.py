from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.workout import (
    WorkoutSessionCreate, WorkoutSessionUpdate, WorkoutSessionResponse,
    SessionExerciseCreate, SessionExerciseResponse,
    SetCreate, SetResponse,
    ExerciseResponse
)
from app.crud.workout import (
    get_workout_session, get_workout_sessions_by_user,
    create_workout_session, update_workout_session, delete_workout_session,
    add_exercise_to_session, remove_exercise_from_session, add_set_to_exercise
)
from app.crud.exercise import get_exercise
from app.dependencies import get_current_active_user
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import SessionExercise

router = APIRouter()

@router.post("/", response_model=WorkoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_workout(
    workout_in: WorkoutSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    workout = await create_workout_session(db, workout_in, current_user.id)
    # Load relations used by the response model to avoid async lazy-load errors
    await db.refresh(workout, attribute_names=['user', 'session_exercises'])
    return workout

@router.get("/", response_model=List[WorkoutSessionResponse])
async def read_workouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    workouts = await get_workout_sessions_by_user(
        db, current_user.id, skip, limit, start_date, end_date
    )
    # We need to load the user for each workout? Actually, the relationship is set.
    # But to avoid lazy loading issues, we can joinload in the query, but for simplicity we assume it's loaded.
    return workouts

@router.get("/{workout_id}", response_model=WorkoutSessionResponse)
async def read_workout(
    workout_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    workout = await get_workout_session(db, workout_id)
    if not workout or workout.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workout not found")
    await db.refresh(workout, attribute_names=['user', 'session_exercises'])
    return workout

@router.patch("/{workout_id}", response_model=WorkoutSessionResponse)
async def update_workout(
    workout_id: int,
    workout_in: WorkoutSessionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    workout = await get_workout_session(db, workout_id)
    if not workout or workout.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workout not found")
    updated_workout = await update_workout_session(db, workout_id, workout_in)
    await db.refresh(updated_workout, attribute_names=['user', 'session_exercises'])
    return updated_workout

@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    workout_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    workout = await get_workout_session(db, workout_id)
    if not workout or workout.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workout not found")
    success = await delete_workout_session(db, workout_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete workout")
    return None

@router.post("/{workout_id}/exercises", response_model=SessionExerciseResponse, status_code=status.HTTP_201_CREATED)
async def add_exercise_to_workout(
    workout_id: int,
    exercise_in: SessionExerciseCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    workout = await get_workout_session(db, workout_id)
    if not workout or workout.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workout not found")
    session_exercise = await add_exercise_to_session(db, workout_id, exercise_in)
    if not session_exercise:
        raise HTTPException(status_code=400, detail="Could not add exercise to workout")
    # Load the exercise for the response
    await db.refresh(session_exercise, attribute_names=['exercise'])
    return session_exercise

@router.delete("/{workout_id}/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_exercise_from_workout(
    workout_id: int,
    exercise_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    workout = await get_workout_session(db, workout_id)
    if not workout or workout.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workout not found")
    success = await remove_exercise_from_session(db, workout_id, exercise_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not remove exercise from workout")
    return None

@router.post("/{workout_id}/exercises/{exercise_id}/sets", response_model=SetResponse, status_code=status.HTTP_201_CREATED)
async def add_set_to_workout_exercise(
    workout_id: int,
    exercise_id: int,
    set_in: SetCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    workout = await get_workout_session(db, workout_id)
    if not workout or workout.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workout not found")
    # Check if the exercise is in the workout
    result = await db.execute(
        select(SessionExercise).where(
            SessionExercise.session_id == workout_id,
            SessionExercise.exercise_id == exercise_id
        )
    )
    session_exercise = result.scalar_one_or_none()
    if not session_exercise:
        raise HTTPException(status_code=404, detail="Exercise not found in workout")
    new_set = await add_set_to_exercise(db, session_exercise.id, set_in)
    if not new_set:
        raise HTTPException(status_code=400, detail="Could not add set")
    return new_set
