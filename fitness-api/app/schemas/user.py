from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime
import re

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., example="John Doe")

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, example="SecurePass123")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserInDB(UserInDBBase):
    hashed_password: str

class UserResponse(UserInDBBase):
    pass

class UserRegisterResponse(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: int
