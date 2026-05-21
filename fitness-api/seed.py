"""
Seed script to populate the exercises table with 50 exercises across Push/Pull/Legs/Core
and seed global workout templates.
"""
import asyncio
from app.database import AsyncSessionLocal, engine
from sqlalchemy import select
from app.models import Base, Exercise, MuscleGroup, EquipmentType, Template

# List of exercises to seed
EXERCISES = [
    # Push - Barbell
    {"name": "Barbell Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Overhead Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Incline Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Close-Grip Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Push Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BARBELL},
    # Push - Dumbbell
    {"name": "Dumbbell Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Overhead Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Incline Bench Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Fly", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Lateral Raise", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.DUMBBELL},
    # Push - Machine
    {"name": "Machine Chest Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Shoulder Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Triceps Extension", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Pec Fly", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.MACHINE},
    # Push - Bodyweight
    {"name": "Push-Up", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Dips", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Pike Push-Up", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.BODYWEIGHT},
    # Push - Kettlebell
    {"name": "Kettlebell Overhead Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Kettlebell Floor Press", "muscle_group": MuscleGroup.PUSH, "equipment_type": EquipmentType.KETTLEBELL},
    # Pull - Barbell
    {"name": "Barbell Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Deadlift", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Curl", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Shrug", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Pendlay Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BARBELL},
    # Pull - Dumbbell
    {"name": "Dumbbell Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Curl", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Hammer Curl", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Shrug", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Pullover", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.DUMBBELL},
    # Pull - Machine
    {"name": "Lat Pulldown", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.MACHINE},
    {"name": "Seated Cable Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Bicep Curl", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.MACHINE},
    {"name": "Machine Rear Delt Fly", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.MACHINE},
    # Pull - Bodyweight
    {"name": "Pull-Up", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Chin-Up", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Inverted Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.BODYWEIGHT},
    # Pull - Kettlebell
    {"name": "Kettlebell Row", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Kettlebell Deadlift", "muscle_group": MuscleGroup.PULL, "equipment_type": EquipmentType.KETTLEBELL},
    # Legs - Barbell
    {"name": "Barbell Back Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Front Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Romanian Deadlift", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Lunge", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    {"name": "Barbell Hip Thrust", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BARBELL},
    # Legs - Dumbbell
    {"name": "Dumbbell Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Lunge", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Romanian Deadlift", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Dumbbell Step-Up", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.DUMBBELL},
    # Legs - Machine
    {"name": "Leg Press", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.MACHINE},
    {"name": "Leg Extension", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.MACHINE},
    {"name": "Leg Curl", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.MACHINE},
    {"name": "Calf Raise Machine", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.MACHINE},
    # Legs - Bodyweight
    {"name": "Bodyweight Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Walking Lunge", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Glute Bridge", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Calf Raise", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.BODYWEIGHT},
    # Legs - Kettlebell
    {"name": "Kettlebell Swing", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.KETTLEBELL},
    {"name": "Kettlebell Goblet Squat", "muscle_group": MuscleGroup.LEGS, "equipment_type": EquipmentType.KETTLEBELL},
    # Core - Bodyweight
    {"name": "Plank", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Crunches", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Leg Raises", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Russian Twist", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    {"name": "Bicycle Crunch", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.BODYWEIGHT},
    # Core - Dumbbell
    {"name": "Dumbbell Side Bend", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.DUMBBELL},
    {"name": "Weighted Plank", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.DUMBBELL},
    # Core - Machine
    {"name": "Cable Crunch", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.MACHINE},
    {"name": "Abdominal Machine", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.MACHINE},
    # Core - Kettlebell
    {"name": "Kettlebell Windmill", "muscle_group": MuscleGroup.CORE, "equipment_type": EquipmentType.KETTLEBELL},
]

# Global templates data for seeding
GLOBAL_TEMPLATES = [
    {
        "name": "PPL Push A",
        "type": "ppl",
        "description": "Push day focusing on chest, shoulders, and triceps",
        "is_global": True,
        "exercises": ["Barbell Bench Press", "Barbell Overhead Press", "Dumbbell Incline Bench Press",
                   "Triceps Pushdown", "Dumbbell Lateral Raise"]
    },
    {
        "name": "PPL Pull A",
        "type": "ppl",
        "description": "Pull day focusing on back and biceps",
        "is_global": True,
        "exercises": ["Barbell Deadlift", "Barbell Row", "Lat Pulldown",
                   "Face Pull", "Barbell Curl"]
    },
    {
        "name": "PPL Legs A",
        "type": "ppl",
        "description": "Leg day focusing on quads, hamstrings, and calves",
        "is_global": True,
        "exercises": ["Barbell Back Squat", "Romanian Deadlift", "Leg Press",
                   "Leg Curl", "Standing Calf Raise"]
    },
    {
        "name": "PPL Push B",
        "type": "ppl",
        "description": "Alternate push day with different exercises",
        "is_global": True,
        "exercises": ["Dumbbell Shoulder Press", "Cable Fly", "Dips",
                   "Skull Crushers", "Triceps Overhead Extension"]
    },
    {
        "name": "PPL Pull B",
        "type": "ppl",
        "description": "Alternate pull day with different exercises",
        "is_global": True,
        "exercises": ["Pull-Ups", "Seated Cable Row", "Single-Arm Dumbbell Row",
                   "Hammer Curl", "Reverse Fly"]
    },
    {
        "name": "PPL Legs B",
        "type": "ppl",
        "description": "Alternate leg day with different exercises",
        "is_global": True,
        "exercises": ["Front Squat", "Bulgarian Split Squat", "Hip Thrust",
                   "Leg Extension", "Standing Calf Raise"]
    },
    {
        "name": "Full Body Beginner A",
        "type": "beginner",
        "description": "Full body workout for beginners",
        "is_global": True,
        "exercises": ["Barbell Back Squat", "Barbell Bench Press", "Barbell Row",
                   "Barbell Overhead Press", "Barbell Deadlift"]
    },
    {
        "name": "Upper Body",
        "type": "strength",
        "description": "Upper body strength focus",
        "is_global": True,
        "exercises": ["Barbell Bench Press", "Pull-Ups", "Barbell Overhead Press",
                   "Barbell Row", "Dips"]
    },
    {
        "name": "Lower Body",
        "type": "strength",
        "description": "Lower body strength focus",
        "is_global": True,
        "exercises": ["Barbell Back Squat", "Romanian Deadlift", "Leg Press",
                   "Leg Curl", "Hip Thrust", "Standing Calf Raise"]
    },
    {
        "name": "Push/Pull/Legs (Full Week)",
        "type": "ppl",
        "description": "Complete 6-day PPL program",
        "is_global": True,
        "exercises": []  # This is a meta-template description
    }
]


async def seed_exercises() -> None:
    """Seed the exercises table."""
    async with engine.begin() as conn:
        # Create tables if they don't exist (for development)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if we already have exercises
        result = await session.execute(select(Exercise))
        existing_exercises = result.scalars().all()
        if existing_exercises:
            print(f"Database already has {len(existing_exercises)} exercises. Skipping seed.")
            return

        for exercise_data in EXERCISES:
            exercise = Exercise(
                name=exercise_data["name"],
                muscle_group=exercise_data["muscle_group"],
                equipment_type=exercise_data["equipment_type"]
            )
            session.add(exercise)

        await session.commit()
        print(f"Seeded {len(EXERCISES)} exercises.")

        # Seed global templates after exercises are seeded
        await seed_global_templates(session)


def get_exercise_ids_by_names(db, exercise_names: list) -> list:
    """Get exercise IDs for a list of exercise names"""
    exercise_ids = []
    for name in exercise_names:
        exercise = db.query(Exercise).filter(Exercise.name == name).first()
        if exercise:
            exercise_ids.append(exercise.id)
    return exercise_ids


async def seed_global_templates(db) -> None:
    """Seed the global workout templates"""
    # Check if we already have templates
    result = db.query(Template).filter(Template.is_global == True).all()
    if len(result) > 0:
        print(f"Database already has {len(result)} global templates. Skipping seed.")
        return

    # Create templates
    for template_data in GLOBAL_TEMPLATES:
        exercise_names = template_data.pop("exercises", [])
        template = Template(**template_data, is_global=True)
        db.add(template)
        db.flush()  # Get ID

        # Add exercises if any
        if exercise_names:
            exercise_ids = get_exercise_ids_by_names(db, exercise_names)
            template.exercises = exercise_ids

    db.commit()
    print(f"Seeded {len(GLOBAL_TEMPLATES)} global templates.")


if __name__ == "__main__":
    # Run the seeding function
    async def run_seeding():
        async with AsyncSessionLocal() as session:
            await seed_exercises()
        print("Seeding completed!")

    asyncio.run(run_seeding())
