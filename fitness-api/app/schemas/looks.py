from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SkinLogBase(BaseModel):
    water_intake_ml: Optional[int] = None
    sleep_hours: Optional[float] = None
    sunscreen_used: Optional[bool] = False
    face_wash_am: Optional[bool] = False
    face_wash_pm: Optional[bool] = False
    moisturiser: Optional[bool] = False
    notes: Optional[str] = None


class SkinLogCreate(SkinLogBase):
    pass


class SkinLog(SkinLogBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        orm_mode = True


class HairLogBase(BaseModel):
    washed: Optional[bool] = False
    oiled: Optional[bool] = False
    product_used: Optional[str] = None
    notes: Optional[str] = None


class HairLogCreate(HairLogBase):
    pass


class HairLog(HairLogBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        orm_mode = True


class JawlineLogBase(BaseModel):
    mewing_minutes: Optional[int] = 0
    gua_sha: Optional[bool] = False
    chewing_gum_minutes: Optional[int] = 0
    notes: Optional[str] = None


class JawlineLogCreate(JawlineLogBase):
    pass


class JawlineLog(JawlineLogBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        orm_mode = True


class LooksGoalBase(BaseModel):
    category: str  # skin/hair/jawline/posture/style/grooming
    goal_text: str
    target_date: Optional[datetime] = None
    completed: Optional[bool] = False


class LooksGoalCreate(LooksGoalBase):
    pass


class LooksGoalUpdate(BaseModel):
    category: Optional[str] = None
    goal_text: Optional[str] = None
    target_date: Optional[datetime] = None
    completed: Optional[bool] = None


class LooksGoal(LooksGoalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class LooksChecklistBase(BaseModel):
    items: str  # JSON string


class LooksChecklistCreate(LooksChecklistBase):
    pass


class LooksChecklistUpdate(BaseModel):
    items: Optional[str] = None


class LooksChecklist(LooksChecklistBase):
    id: int
    user_id: int
    date: datetime

    class Config:
        orm_mode = True


class LooksStats(BaseModel):
    skin_streak: int
    hair_streak: int
    jawline_streak: int
    avg_water_intake: int  # in ml
    avg_sleep_hours: float  # in hours

    class Config:
        orm_mode = True