import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal, engine
from app.models import Base, Exercise, MuscleGroup, EquipmentType

EXERCISES = [
    {"name": "Barbell Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Overhead Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Incline Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Close-Grip Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Push Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Dumbbell Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Overhead Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Incline Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Fly", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Lateral Raise", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Machine Chest Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Shoulder Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Triceps Extension", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Pec Fly", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.MACHINE},
    {"name": "Push-Up", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Dips", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Pike Push-Up", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Kettlebell Overhead Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Kettlebell Floor Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Barbell Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Deadlift", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Curl", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Shrug", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Pendlay Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Dumbbell Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Curl", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Hammer Curl", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Shrug", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Pullover", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Lat Pulldown", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.MACHINE},
    {"name": "Seated Cable Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Bicep Curl", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Rear Delt Fly", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.MACHINE},
    {"name": "Pull-Up", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Chin-Up", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Inverted Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Kettlebell Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Kettlebell Deadlift", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Barbell Back Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Front Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Romanian Deadlift", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Lunge", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Hip Thrust", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Dumbbell Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Lunge", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Romanian Deadlift", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Step-Up", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Leg Press", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.MACHINE},
    {"name": "Leg Extension", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.MACHINE},
    {"name": "Leg Curl", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.MACHINE},
    {"name": "Calf Raise Machine", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.MACHINE},
    {"name": "Bodyweight Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Walking Lunge", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Glute Bridge", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Calf Raise", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Kettlebell Swing", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Kettlebell Goblet Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Plank", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Crunches", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Leg Raises", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Russian Twist", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Bicycle Crunch", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Dumbbell Side Bend", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Weighted Plank", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Cable Crunch", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.MACHINE},
    {"name": "Abdominal Machine", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.MACHINE},
    {"name": "Kettlebell Windmill", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.KETTLEBELL},
]

async def seed_exercises() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Exercise))
        existing = result.scalars().all()
        if existing:
            return

        for exercise_data in EXERCISES:
            session.add(Exercise(
                name=exercise_data['name'],
                muscle_group=exercise_data['muscle_group'],
                equipment_type=exercise_data['equipment_type'],
            ))
        await session.commit()

if __name__ == '__main__':
    asyncio.run(seed_exercises())
