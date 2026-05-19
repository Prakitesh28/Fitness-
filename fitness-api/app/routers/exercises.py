from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.workout import ExerciseResponse, ExerciseCreate, ExerciseUpdate
from app.crud.exercise import get_exercise, get_exercises, create_exercise, update_exercise, delete_exercise
from app.dependencies import get_current_active_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

def get_current_active_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.email not in settings.ADMIN_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

@router.get("/", response_model=List[ExerciseResponse])
async def read_exercises(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    muscle_group: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    exercises = await get_exercises(db, skip=skip, limit=limit, muscle_group=muscle_group)
    return exercises

@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    exercise_in: ExerciseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)  # Admin only
):
    exercise = await create_exercise(db, exercise_in)
    return exercise

@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def read_exercise(
    exercise_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    exercise = await get_exercise(db, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise

@router.patch("/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise(
    exercise_id: int,
    exercise_in: ExerciseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)  # Admin only
):
    exercise = await get_exercise(db, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    updated_exercise = await update_exercise(db, exercise_id, exercise_in)
    return updated_exercise

@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)  # Admin only
):
    exercise = await get_exercise(db, exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    success = await delete_exercise(db, exercise_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete exercise")
    return None
