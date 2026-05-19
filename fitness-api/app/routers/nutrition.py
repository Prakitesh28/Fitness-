from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.metrics import NutritionLogResponse, NutritionLogCreate, NutritionLogUpdate
from app.crud.nutrition import (
    get_nutrition_log,
    get_nutrition_logs_by_user,
    create_nutrition_log,
    update_nutrition_log,
    delete_nutrition_log
)
from app.dependencies import get_current_active_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.post("/", response_model=NutritionLogResponse, status_code=status.HTTP_201_CREATED)
async def create_nutrition_log(
    log_in: NutritionLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    log = await create_nutrition_log(db, log_in, current_user.id)
    return log

@router.get("/", response_model=List[NutritionLogResponse])
async def read_nutrition_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    logs = await get_nutrition_logs_by_user(
        db, current_user.id, skip, limit, start_date, end_date
    )
    return logs

@router.get("/{log_id}", response_model=NutritionLogResponse)
async def read_nutrition_log(
    log_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    log = await get_nutrition_log(db, log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    return log

@router.patch("/{log_id}", response_model=NutritionLogResponse)
async def update_nutrition_log(
    log_id: int,
    log_in: NutritionLogUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    log = await get_nutrition_log(db, log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    updated_log = await update_nutrition_log(db, log_id, log_in)
    return updated_log

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_nutrition_log(
    log_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    log = await get_nutrition_log(db, log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    success = await delete_nutrition_log(db, log_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete nutrition log")
    return None
