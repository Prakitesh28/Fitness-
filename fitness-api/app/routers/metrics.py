from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.metrics import BodyMetricResponse, BodyMetricCreate, BodyMetricUpdate
from app.crud.body_metric import (
    get_body_metric,
    get_body_metrics_by_user,
    create_body_metric,
    update_body_metric,
    delete_body_metric
)
from app.dependencies import get_current_active_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.post("/body", response_model=BodyMetricResponse, status_code=status.HTTP_201_CREATED)
async def create_body_metric(
    metric_in: BodyMetricCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    metric = await create_body_metric(db, metric_in, current_user.id)
    return metric

@router.get("/body", response_model=List[BodyMetricResponse])
async def read_body_metrics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    metrics = await get_body_metrics_by_user(
        db, current_user.id, skip, limit, start_date, end_date
    )
    return metrics

@router.get("/body/{metric_id}", response_model=BodyMetricResponse)
async def read_body_metric(
    metric_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    metric = await get_body_metric(db, metric_id)
    if not metric or metric.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Body metric not found")
    return metric

@router.patch("/body/{metric_id}", response_model=BodyMetricResponse)
async def update_body_metric(
    metric_id: int,
    metric_in: BodyMetricUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    metric = await get_body_metric(db, metric_id)
    if not metric or metric.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Body metric not found")
    updated_metric = await update_body_metric(db, metric_id, metric_in)
    return updated_metric

@router.delete("/body/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_body_metric(
    metric_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    metric = await get_body_metric(db, metric_id)
    if not metric or metric.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Body metric not found")
    success = await delete_body_metric(db, metric_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete body metric")
    return None
