from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Time, ForeignKey, Text, Enum
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum
from app.database import Base

# Enums
class MuscleGroup(str, enum.Enum):
    PUSH = "push"
    PULL = "pull"
    LEGS = "legs"
    CORE = "core"
    OTHER = "other"

class EquipmentType(str, enum.Enum):
    BARBELL = "barbell"
    DUMBBELL = "dumbbell"
    MACHINE = "machine"
    BODYWEIGHT = "bodyweight"
    KETTLEBELL = "kettlebell"
    OTHER = "other"

# Models
from .template import Template

class User(Base, AsyncAttrs):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    calories_goal = Column(Integer, nullable=False, default=2200)
    protein_goal = Column(Integer, nullable=False, default=150)
    carbs_goal = Column(Integer, nullable=False, default=250)
    fat_goal = Column(Integer, nullable=False, default=70)

    # Relationships
    workout_sessions = relationship("WorkoutSession", back_populates="user", cascade="all, delete-orphan")
    body_metrics = relationship("BodyMetric", back_populates="user", cascade="all, delete-orphan")
    nutrition_logs = relationship("NutritionLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class WorkoutSession(Base, AsyncAttrs):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="workout_sessions")
    session_exercises = relationship("SessionExercise", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WorkoutSession(id={self.id}, user_id={self.user_id}, date='{self.date}')>"


class Exercise(Base, AsyncAttrs):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    muscle_group = Column(Enum(MuscleGroup), nullable=False)
    equipment_type = Column(Enum(EquipmentType), nullable=False)

    # Relationships
    session_exercises = relationship("SessionExercise", back_populates="exercise")

    def __repr__(self):
        return f"<Exercise(id={self.id}, name='{self.name}', muscle_group='{self.muscle_group}')>"


class SessionExercise(Base, AsyncAttrs):
    __tablename__ = "session_exercises"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    order_index = Column(Integer, nullable=False)

    # Relationships
    session = relationship("WorkoutSession", back_populates="session_exercises")
    exercise = relationship("Exercise", back_populates="session_exercises")
    sets = relationship("Set", back_populates="session_exercise", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SessionExercise(id={self.id}, session_id={self.session_id}, exercise_id={self.exercise_id})>"


class Set(Base, AsyncAttrs):
    __tablename__ = "sets"

    id = Column(Integer, primary_key=True, index=True)
    session_exercise_id = Column(Integer, ForeignKey("session_exercises.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    weight_kg = Column(Float, nullable=False)
    rpe = Column(Integer, nullable=True)  # Rating of Perceived Effort (1-10)

    # Relationships
    session_exercise = relationship("SessionExercise", back_populates="sets")

    def __repr__(self):
        return f"<Set(id={self.id}, session_exercise_id={self.session_exercise_id}, set_number={self.set_number})>"


class BodyMetric(Base, AsyncAttrs):
    __tablename__ = "body_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    weight_kg = Column(Float, nullable=False)
    body_fat_pct = Column(Float, nullable=True)

    # Relationships
    user = relationship("User", back_populates="body_metrics")

    def __repr__(self):
        return f"<BodyMetric(id={self.id}, user_id={self.user_id}, date='{self.date}')>"


class NutritionLog(Base, AsyncAttrs):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    calories = Column(Integer, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)

    # Relationships
    user = relationship("User", back_populates="nutrition_logs")

    def __repr__(self):
        return f"<NutritionLog(id={self.id}, user_id={self.user_id}, date='{self.date}')>"