from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from app.schemas.user import UserResponse

class ExerciseBase(BaseModel):
    id: int
    name: str
    muscle_group: str
    equipment_type: str

    model_config = ConfigDict(from_attributes=True)

class SetBase(BaseModel):
    id: int
    set_number: int
    reps: int
    weight_kg: float
    rpe: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class SessionExerciseBase(BaseModel):
    id: int
    order_index: int
    exercise: ExerciseBase
    sets: List[SetBase] = []

    model_config = ConfigDict(from_attributes=True)

class WorkoutSessionBase(BaseModel):
    id: int
    date: date
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    session_exercises: List[SessionExerciseBase] = []

    model_config = ConfigDict(from_attributes=True)

class WorkoutSessionCreate(BaseModel):
    date: date
    notes: Optional[str] = None

class WorkoutSessionUpdate(BaseModel):
    date: Optional[date] = None
    notes: Optional[str] = None

class WorkoutSessionResponse(WorkoutSessionBase):
    user: UserResponse

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: str
    equipment_type: str

class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    muscle_group: Optional[str] = None
    equipment_type: Optional[str] = None

class ExerciseResponse(ExerciseBase):
    pass

class SessionExerciseCreate(BaseModel):
    exercise_id: int
    order_index: int

class SessionExerciseUpdate(BaseModel):
    order_index: Optional[int] = None

class SessionExerciseResponse(SessionExerciseBase):
    pass

class SetCreate(BaseModel):
    set_number: int
    reps: int
    weight_kg: float
    rpe: Optional[int] = None

class SetUpdate(BaseModel):
    set_number: Optional[int] = None
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    rpe: Optional[int] = None

class SetResponse(SetBase):
    pass
