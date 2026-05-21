from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TemplateBase(BaseModel):
    name: str
    type: str  # ppl/strength/beginner/custom
    description: Optional[str] = None
    is_global: bool = False
    exercises: List[int]  # List of exercise IDs


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    is_global: Optional[bool] = None
    exercises: Optional[List[int]] = None


class Template(TemplateBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True


class TemplateStartResponse(BaseModel):
    id: int
    message: str

    class Config:
        orm_mode = True