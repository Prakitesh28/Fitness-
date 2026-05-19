from typing import List, Literal, Optional
from pydantic import BaseModel

class CoachSuggestion(BaseModel):
    area: str
    advice: str
    priority: Literal["high", "medium", "low"]

class CoachAnalysis(BaseModel):
    summary: str
    suggestions: List[CoachSuggestion]
    deload_recommended: bool
    deload_reason: Optional[str] = None
    stalling_exercises: List[str]
    analysed_weeks: int
