from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class SkinLog(Base):
    __tablename__ = "skin_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    water_intake_ml = Column(Integer, nullable=True)
    sleep_hours = Column(Float, nullable=True)
    sunscreen_used = Column(Boolean, default=False)
    face_wash_am = Column(Boolean, default=False)
    face_wash_pm = Column(Boolean, default=False)
    moisturiser = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="skin_logs")


class HairLog(Base):
    __tablename__ = "hair_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    washed = Column(Boolean, default=False)
    oiled = Column(Boolean, default=False)
    product_used = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="hair_logs")


class JawlineLog(Base):
    __tablename__ = "jawline_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    mewing_minutes = Column(Integer, default=0)
    gua_sha = Column(Boolean, default=False)
    chewing_gum_minutes = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="jawline_logs")


class LooksGoal(Base):
    __tablename__ = "looks_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(20), nullable=False)  # skin/hair/jawline/posture/style/grooming
    goal_text = Column(String(255), nullable=False)
    target_date = Column(DateTime, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="looks_goals")


class LooksChecklist(Base):
    __tablename__ = "looks_checklists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    items = Column(Text, nullable=False)  # JSON string of checklist completion state

    user = relationship("User", back_populates="looks_checklists")