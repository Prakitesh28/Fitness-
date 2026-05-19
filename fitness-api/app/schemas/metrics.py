from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class BodyMetricBase(BaseModel):
    date: date
    weight_kg: float
    body_fat_pct: Optional[float] = None

class BodyMetricCreate(BodyMetricBase):
    pass

class BodyMetricUpdate(BaseModel):
    weight_kg: Optional[float] = None
    body_fat_pct: Optional[float] = None

class BodyMetricResponse(BodyMetricBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class NutritionLogBase(BaseModel):
    date: date
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

class NutritionLogCreate(NutritionLogBase):
    pass

class NutritionLogUpdate(BaseModel):
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None

class NutritionLogResponse(NutritionLogBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True