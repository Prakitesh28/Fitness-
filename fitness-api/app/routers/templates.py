from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models import templates as models
from app.models import user as user_models
from app.models import exercise as exercise_models
from app.models import workout as workout_models
from app.routers.auth import get_current_active_user
from app.schemas import templates as schemas

router = APIRouter(prefix="/templates", tags=["templates"])


# Helper function to get exercise IDs by name (for seeding)
def get_exercise_ids_by_names(db: Session, exercise_names: List[str]) -> List[int]:
    """Get exercise IDs for a list of exercise names"""
    exercise_ids = []
    for name in exercise_names:
        exercise = db.query(exercise_models.Exercise).filter(
            exercise_models.Exercise.name == name
        ).first()
        if exercise:
            exercise_ids.append(exercise.id)
    return exercise_ids


@router.get("/", response_model=List[schemas.Template])
def read_templates(
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_active_user)
):
    """List all global templates + user's custom templates"""
    templates = db.query(models.Template).filter(
        (models.Template.is_global == True) |
        (models.Template.user_id == current_user.id)
    ).order_by(models.Template.created_at.desc()).all()
    return templates


@router.get("/{template_id}", response_model=schemas.Template)
def read_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_active_user)
):
    template = db.query(models.Template).filter(
        models.Template.id == template_id,
        (models.Template.is_global == True) |
        (models.Template.user_id == current_user.id)
    ).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/", response_model=schemas.Template)
def create_template(
    template: schemas.TemplateCreate,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_active_user)
):
    """Create custom template (auth required)"""
    # Convert exercise names to IDs if needed
    exercise_ids = template.exercises
    if isinstance(template.exercises, list) and len(template.exercises) > 0:
        if isinstance(template.exercises[0], str):
            # Convert names to IDs
            exercise_ids = get_exercise_ids_by_names(db, template.exercises)

    db_template = models.Template(
        **template.dict(exclude={"exercises"}),
        exercises=exercise_ids,
        user_id=current_user.id,
        is_global=False
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.post("/{template_id}/start", response_model=schemas.TemplateStartResponse)
def start_workout_from_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: user_models.User = Depends(get_current_active_user)
):
    """Creates a new WorkoutSession pre-populated with template exercises, returns session id"""
    # Get template
    template = db.query(models.Template).filter(
        models.Template.id == template_id,
        (models.Template.is_global == True) |
        (models.Template.user_id == current_user.id)
    ).first()
    if template is None:
        raise HTTPException(status_code=404, detail="Template not found")

    # Create workout session
    workout_session = workout_models.WorkoutSession(
        user_id=current_user.id,
        date=date.today(),
        name=template.name,
        type=template.type.upper() if template.type in ["ppl", "strength", "beginner"] else "CUSTOM"
    )
    db.add(workout_session)
    db.flush()  # Get the ID without committing

    # Add session exercises from template
    if template.exercises:
        for index, exercise_id in enumerate(template.exercises):
            session_exercise = workout_models.SessionExercise(
                session_id=workout_session.id,
                exercise_id=exercise_id,
                order_index=index
            )
            db.add(session_exercise)

    db.commit()
    db.refresh(workout_session)

    return schemas.TemplateStartResponse(
        id=workout_session.id,
        message="Workout created from template successfully"
    )


