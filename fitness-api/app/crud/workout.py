from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from sqlalchemy.orm import selectinload
from app.models import WorkoutSession, SessionExercise, Set, Exercise
from app.schemas.workout import WorkoutSessionCreate, WorkoutSessionUpdate, SessionExerciseCreate, SetCreate
from typing import List, Optional

async def get_workout_session(db: AsyncSession, session_id: int) -> WorkoutSession | None:
    query = select(WorkoutSession).options(
        selectinload(WorkoutSession.user),
        selectinload(WorkoutSession.session_exercises).selectinload(SessionExercise.exercise),
        selectinload(WorkoutSession.session_exercises).selectinload(SessionExercise.sets),
    ).where(WorkoutSession.id == session_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_workout_sessions_by_user(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[WorkoutSession]:
    query = select(WorkoutSession).options(
        selectinload(WorkoutSession.user),
        selectinload(WorkoutSession.session_exercises).selectinload(SessionExercise.exercise),
        selectinload(WorkoutSession.session_exercises).selectinload(SessionExercise.sets),
    ).where(WorkoutSession.user_id == user_id)
    if start_date:
        query = query.where(WorkoutSession.date >= start_date)
    if end_date:
        query = query.where(WorkoutSession.date <= end_date)
    query = query.offset(skip).limit(limit).order_by(WorkoutSession.date.desc())
    result = await db.execute(query)
    return result.scalars().all()

async def create_workout_session(
    db: AsyncSession,
    session_in: WorkoutSessionCreate,
    user_id: int
) -> WorkoutSession:
    session = WorkoutSession(
        user_id=user_id,
        date=session_in.date,
        notes=session_in.notes
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def update_workout_session(
    db: AsyncSession,
    session_id: int,
    session_in: WorkoutSessionUpdate
) -> WorkoutSession | None:
    session = await get_workout_session(db, session_id)
    if not session:
        return None
    update_data = session_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)
    await db.commit()
    await db.refresh(session)
    return session

async def delete_workout_session(db: AsyncSession, session_id: int) -> bool:
    session = await get_workout_session(db, session_id)
    if not session:
        return False
    await db.delete(session)
    await db.commit()
    return True

async def add_exercise_to_session(
    db: AsyncSession,
    session_id: int,
    exercise_in: SessionExerciseCreate
) -> SessionExercise:
    # Check if session exists
    session = await get_workout_session(db, session_id)
    if not session:
        return None
    # Check if exercise exists
    result = await db.execute(select(Exercise).where(Exercise.id == exercise_in.exercise_id))
    exercise = result.scalar_one_or_none()
    if not exercise:
        return None
    session_exercise = SessionExercise(
        session_id=session_id,
        exercise_id=exercise_in.exercise_id,
        order_index=exercise_in.order_index
    )
    db.add(session_exercise)
    await db.commit()
    await db.refresh(session_exercise)
    return session_exercise

async def remove_exercise_from_session(db: AsyncSession, session_id: int, exercise_id: int) -> bool:
    result = await db.execute(
        select(SessionExercise).where(
            and_(
                SessionExercise.session_id == session_id,
                SessionExercise.exercise_id == exercise_id
            )
        )
    )
    session_exercise = result.scalar_one_or_none()
    if not session_exercise:
        return False
    await db.delete(session_exercise)
    await db.commit()
    return True

async def add_set_to_exercise(
    db: AsyncSession,
    session_exercise_id: int,
    set_in: SetCreate
) -> Set:
    # Check if session_exercise exists
    result = await db.execute(select(SessionExercise).where(SessionExercise.id == session_exercise_id))
    session_exercise = result.scalar_one_or_none()
    if not session_exercise:
        return None
    # Get the current max set number for this session_exercise to set order if not provided
    # But we are using set_number from input, so we just create
    stmt = select(Set).where(Set.session_exercise_id == session_exercise_id).order_by(Set.set_number.desc())
    result = await db.execute(stmt)
    last_set = result.scalar_one_or_none()
    set_number = set_in.set_number
    # If set_number is not provided, we would use last_set.set_number + 1, but we require it in input
    new_set = Set(
        session_exercise_id=session_exercise_id,
        set_number=set_number,
        reps=set_in.reps,
        weight_kg=set_in.weight_kg,
        rpe=set_in.rpe
    )
    db.add(new_set)
    await db.commit()
    await db.refresh(new_set)
    return new_set
