from fastapi import APIRouter, Depends, HTTPException, status
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.user import UserResponse, UserUpdate
from app.crud.user import get_user_by_id, update_user, delete_user
from app.dependencies import get_current_active_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
async def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    user = await update_user(db, user_id=current_user.id, user_in=user_in)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_me(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    success = await delete_user(db, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return None
