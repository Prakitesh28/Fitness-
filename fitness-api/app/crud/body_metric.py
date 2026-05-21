from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models import BodyMetric
from app.schemas.metrics import BodyMetricCreate, BodyMetricUpdate
from typing import List, Optional

async def get_body_metric(db: AsyncSession, metric_id: int) -> BodyMetric | None:
    result = await db.execute(select(BodyMetric).where(BodyMetric.id == metric_id))
    return result.scalar_one_or_none()

async def get_body_metrics_by_user(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[BodyMetric]:
    query = select(BodyMetric).where(BodyMetric.user_id == user_id)
    if start_date:
        query = query.where(BodyMetric.date >= start_date)
    if end_date:
        query = query.where(BodyMetric.date <= end_date)
    query = query.offset(skip).limit(limit).order_by(BodyMetric.date.desc())
    result = await db.execute(query)
    return result.scalars().all()

async def create_body_metric(db: AsyncSession, metric_in: BodyMetricCreate, user_id: int) -> BodyMetric:
    metric = BodyMetric(
        user_id=user_id,
        date=metric_in.date,
        weight_kg=metric_in.weight_kg,
        body_fat_pct=metric_in.body_fat_pct,
        chest_cm=metric_in.chest_cm,
        waist_cm=metric_in.waist_cm,
        hips_cm=metric_in.hips_cm,
        thigh_cm=metric_in.thigh_cm,
        bicep_cm=metric_in.bicep_cm
    )
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric

async def update_body_metric(
    db: AsyncSession,
    metric_id: int,
    metric_in: BodyMetricUpdate
) -> BodyMetric | None:
    metric = await get_body_metric(db, metric_id)
    if not metric:
        return None
    update_data = metric_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(metric, field, value)
    await db.commit()
    await db.refresh(metric)
    return metric

async def delete_body_metric(db: AsyncSession, metric_id: int) -> bool:
    metric = await get_body_metric(db, metric_id)
    if not metric:
        return False
    await db.delete(metric)
    await db.commit()
    return True
