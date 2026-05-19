from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models import Exercise
from app.schemas.workout import ExerciseCreate, ExerciseUpdate
from typing import List, Optional

async def get_exercise(db: AsyncSession, exercise_id: int) -> Exercise | None:
    result = await db.execute(select(Exercise).where(Exercise.id == exercise_id))
    return result.scalar_one_or_none()

async def get_exercises(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    muscle_group: Optional[str] = None
) -> List[Exercise]:
    query = select(Exercise)
    if muscle_group:
        query = query.where(Exercise.muscle_group == muscle_group)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def create_exercise(db: AsyncSession, exercise_in: ExerciseCreate) -> Exercise:
    exercise = Exercise(
        name=exercise_in.name,
        muscle_group=exercise_in.muscle_group,
        equipment_type=exercise_in.equipment_type
    )
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    return exercise

async def update_exercise(
    db: AsyncSession,
    exercise_id: int,
    exercise_in: ExerciseUpdate
) -> Exercise | None:
    exercise = await get_exercise(db, exercise_id)
    if not exercise:
        return None
    update_data = exercise_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exercise, field, value)
    await db.commit()
    await db.refresh(exercise)
    return exercise

async def delete_exercise(db: AsyncSession, exercise_id: int) -> bool:
    exercise = await get_exercise(db, exercise_id)
    if not exercise:
        return False
    await db.delete(exercise)
    await db.commit()
    return True
