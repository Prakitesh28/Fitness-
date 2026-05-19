from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models import NutritionLog
from app.schemas.metrics import NutritionLogCreate, NutritionLogUpdate
from typing import List, Optional

async def get_nutrition_log(db: AsyncSession, log_id: int) -> NutritionLog | None:
    result = await db.execute(select(NutritionLog).where(NutritionLog.id == log_id))
    return result.scalar_one_or_none()

async def get_nutrition_logs_by_user(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[NutritionLog]:
    query = select(NutritionLog).where(NutritionLog.user_id == user_id)
    if start_date:
        query = query.where(NutritionLog.date >= start_date)
    if end_date:
        query = query.where(NutritionLog.date <= end_date)
    query = query.offset(skip).limit(limit).order_by(NutritionLog.date.desc())
    result = await db.execute(query)
    return result.scalars().all()

async def create_nutrition_log(db: AsyncSession, log_in: NutritionLogCreate, user_id: int) -> NutritionLog:
    log = NutritionLog(
        user_id=user_id,
        date=log_in.date,
        calories=log_in.calories,
        protein_g=log_in.protein_g,
        carbs_g=log_in.carbs_g,
        fat_g=log_in.fat_g
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

async def update_nutrition_log(
    db: AsyncSession,
    log_id: int,
    log_in: NutritionLogUpdate
) -> NutritionLog | None:
    log = await get_nutrition_log(db, log_id)
    if not log:
        return None
    update_data = log_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)
    await db.commit()
    await db.refresh(log)
    return log

async def delete_nutrition_log(db: AsyncSession, log_id: int) -> bool:
    log = await get_nutrition_log(db, log_id)
    if not log:
        return False
    await db.delete(log)
    await db.commit()
    return True
