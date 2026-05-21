from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
import json

from app.database import get_db
from app.models import looks as models
from app.models import User
from app.routers.auth import get_current_active_user
from app.schemas import looks as schemas

router = APIRouter(tags=["looksmax"])


# Skin endpoints
@router.post("/skin", response_model=schemas.SkinLog)
def create_skin_log(
    skin_log: schemas.SkinLogCreate,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    db_skin_log = models.SkinLog(**skin_log.dict(), user_id=current_user.id)
    db.add(db_skin_log)
    db.commit()
    db.refresh(db_skin_log)
    return db_skin_log


@router.get("/skin", response_model=List[schemas.SkinLog])
def read_skin_logs(
    days: Optional[int] = 30,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    from datetime import timedelta
    start_date = datetime.utcnow() - timedelta(days=days)
    skin_logs = db.query(models.SkinLog).filter(
        models.SkinLog.user_id == current_user.id,
        models.SkinLog.date >= start_date
    ).order_by(models.SkinLog.date.desc()).all()
    return skin_logs


# Hair endpoints
@router.post("/hair", response_model=schemas.HairLog)
def create_hair_log(
    hair_log: schemas.HairLogCreate,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    db_hair_log = models.HairLog(**hair_log.dict(), user_id=current_user.id)
    db.add(db_hair_log)
    db.commit()
    db.refresh(db_hair_log)
    return db_hair_log


@router.get("/hair", response_model=List[schemas.HairLog])
def read_hair_logs(
    days: Optional[int] = 30,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    from datetime import timedelta
    start_date = datetime.utcnow() - timedelta(days=days)
    hair_logs = db.query(models.HairLog).filter(
        models.HairLog.user_id == current_user.id,
        models.HairLog.date >= start_date
    ).order_by(models.HairLog.date.desc()).all()
    return hair_logs


# Jawline endpoints
@router.post("/jawline", response_model=schemas.JawlineLog)
def create_jawline_log(
    jawline_log: schemas.JawlineLogCreate,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    db_jawline_log = models.JawlineLog(**jawline_log.dict(), user_id=current_user.id)
    db.add(db_jawline_log)
    db.commit()
    db.refresh(db_jawline_log)
    return db_jawline_log


@router.get("/jawline", response_model=List[schemas.JawlineLog])
def read_jawline_logs(
    days: Optional[int] = 30,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    from datetime import timedelta
    start_date = datetime.utcnow() - timedelta(days=days)
    jawline_logs = db.query(models.JawlineLog).filter(
        models.JawlineLog.user_id == current_user.id,
        models.JawlineLog.date >= start_date
    ).order_by(models.JawlineLog.date.desc()).all()
    return jawline_logs


# Goals endpoints
@router.post("/goals", response_model=schemas.LooksGoal)
def create_looks_goal(
    goal: schemas.LooksGoalCreate,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    db_goal = models.LooksGoal(**goal.dict(), user_id=current_user.id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.get("/goals", response_model=List[schemas.LooksGoal])
def read_looks_goals(
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    goals = db.query(models.LooksGoal).filter(
        models.LooksGoal.user_id == current_user.id
    ).order_by(models.LooksGoal.created_at.desc()).all()
    return goals


@router.patch("/goals/{goal_id}", response_model=schemas.LooksGoal)
def update_looks_goal(
    goal_id: int,
    goal_update: schemas.LooksGoalUpdate,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    db_goal = db.query(models.LooksGoal).filter(
        models.LooksGoal.id == goal_id,
        models.LooksGoal.user_id == current_user.id
    ).first()
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = goal_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_goal, field, value)

    db.commit()
    db.refresh(db_goal)
    return db_goal


# Checklist endpoints
@router.get("/checklist/today", response_model=schemas.LooksChecklist)
def read_today_checklist(
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    today = date.today()
    checklist = db.query(models.LooksChecklist).filter(
        models.LooksChecklist.user_id == current_user.id,
        models.LooksChecklist.date == today
    ).first()

    if checklist is None:
        # Create default checklist for today
        default_items = {
            "morning": {
                "face_wash": False,
                "moisturiser": False,
                "sunscreen": False,
                "mewing": False,
                "cold_shower": False,
                "hair_styling": False
            },
            "throughout_day": {
                "water_intake": False,
                "posture_check": False,
                "chewing_gum": False,
                "no_junk_food": False
            },
            "evening": {
                "face_wash_pm": False,
                "moisturiser_pm": False,
                "gua_sha": False,
                "sleep_target": False,
                "hair_oil": False
            }
        }
        db_checklist = models.LooksChecklist(
            user_id=current_user.id,
            date=today,
            items=json.dumps(default_items)
        )
        db.add(db_checklist)
        db.commit()
        db.refresh(db_checklist)
        return db_checklist

    return checklist


@router.patch("/checklist/today", response_model=schemas.LooksChecklist)
def update_today_checklist(
    checklist_update: schemas.LooksChecklistUpdate,
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    today = date.today()
    db_checklist = db.query(models.LooksChecklist).filter(
        models.LooksChecklist.user_id == current_user.id,
        models.LooksChecklist.date == today
    ).first()

    if db_checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")

    update_data = checklist_update.dict(exclude_unset=True)

    # Full checklist replace when client sends serialized items JSON
    if "items" in update_data and isinstance(update_data["items"], str):
        db_checklist.items = update_data["items"]
        db.commit()
        db.refresh(db_checklist)
        return db_checklist

    # Parse existing items for partial updates
    items = json.loads(db_checklist.items)

    for key, value in update_data.items():
        if "." in key:  # Handle nested keys like "morning.face_wash"
            section, item = key.split(".", 1)
            if section in items and item in items[section]:
                items[section][item] = value
        else:  # Handle top-level keys
            items[key] = value

    db_checklist.items = json.dumps(items)
    db.commit()
    db.refresh(db_checklist)
    return db_checklist


# Stats endpoint
@router.get("/stats", response_model=schemas.LooksStats)
def get_looks_stats(
    db: Session = Depends(get_db),
    current_user:   User = Depends(get_current_active_user)
):
    from datetime import timedelta, date

    # Calculate streaks for each category (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    # Skin streak (based on skin logs)
    skin_logs = db.query(models.SkinLog).filter(
        models.SkinLog.user_id == current_user.id,
        models.SkinLog.date >= thirty_days_ago
    ).count()

    # Hair streak (based on hair logs)
    hair_logs = db.query(models.HairLog).filter(
        models.HairLog.user_id == current_user.id,
        models.HairLog.date >= thirty_days_ago
    ).count()

    # Jawline streak (based on jawline logs)
    jawline_logs = db.query(models.JawlineLog).filter(
        models.JawlineLog.user_id == current_user.id,
        models.JawlineLog.date >= thirty_days_ago
    ).count()

    # Calculate averages from recent logs
    # Water intake average
    water_logs = db.query(models.SkinLog.water_intake_ml).filter(
        models.SkinLog.user_id == current_user.id,
        models.SkinLog.date >= thirty_days_ago,
        models.SkinLog.water_intake_ml.isnot(None)
    ).all()
    avg_water = sum([w[0] for w in water_logs]) / len(water_logs) if water_logs else 0

    # Sleep average
    sleep_logs = db.query(models.SkinLog.sleep_hours).filter(
        models.SkinLog.user_id == current_user.id,
        models.SkinLog.date >= thirty_days_ago,
        models.SkinLog.sleep_hours.isnot(None)
    ).all()
    avg_sleep = sum([s[0] for s in sleep_logs]) / len(sleep_logs) if sleep_logs else 0

    return schemas.LooksStats(
        skin_streak=skin_logs,
        hair_streak=hair_logs,
        jawline_streak=jawline_logs,
        avg_water_intake=round(avg_water),
        avg_sleep_hours=round(avg_sleep, 1)
    )