from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models import User
from app.schemas.user import UserCreate, UserUpdate

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_in: UserCreate, hashed_password: str) -> User:
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        name=user_in.name
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def update_user(db: AsyncSession, user_id: int, user_in: UserUpdate) -> User | None:
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    update_data = user_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user

async def delete_user(db: AsyncSession, user_id: int) -> bool:
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    await db.delete(user)
    await db.commit()
    return True
