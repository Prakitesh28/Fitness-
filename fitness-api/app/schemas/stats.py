from typing import List
from pydantic import BaseModel

class WeeklyVolumeItem(BaseModel):
    week: str
    muscle_group: str
    total_volume_kg: float

    class Config:
        orm_mode = True

class Estimated1RMResponse(BaseModel):
    exercise_name: str
    estimated_1rm_kg: float
    formula: str

class WorkoutStreakResponse(BaseModel):
    current_streak: int
    longest_streak: int

class MuscleGroupFrequencyItem(BaseModel):
    muscle_group: str
    sessions_count: int
    avg_sets_per_session: float

class ProgressiveOverloadWeek(BaseModel):
    week: str
    max_weight_kg: float
    total_volume_kg: float
    stalling: bool
