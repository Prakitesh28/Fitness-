from __future__ import annotations
from collections import defaultdict
from datetime import date, timedelta
from typing import Dict, List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import WorkoutSession, SessionExercise, Set, Exercise


def iso_week_label(d: date) -> str:
    year, week, _ = d.isocalendar()
    return f"{year}-{week:02d}"


def _week_period_labels(start: date, end: date) -> List[str]:
    current = start - timedelta(days=start.weekday())
    labels: List[str] = []
    while current <= end:
        labels.append(iso_week_label(current))
        current += timedelta(days=7)
    return labels


async def get_weekly_volume(db: AsyncSession, user_id: int, weeks: int = 8) -> List[Dict[str, object]]:
    if weeks < 1:
        weeks = 1
    end_date = date.today()
    start_date = end_date - timedelta(weeks=weeks)

    stmt = select(
        WorkoutSession.date,
        Exercise.muscle_group,
        Set.weight_kg,
        Set.reps
    ).join(SessionExercise, SessionExercise.session_id == WorkoutSession.id)
    stmt = stmt.join(Exercise, Exercise.id == SessionExercise.exercise_id)
    stmt = stmt.join(Set, Set.session_exercise_id == SessionExercise.id)
    stmt = stmt.where(
        WorkoutSession.user_id == user_id,
        WorkoutSession.date >= start_date,
        WorkoutSession.date <= end_date
    )

    result = await db.execute(stmt)
    rows = result.all()

    volumes: Dict[tuple[str, str], float] = defaultdict(float)
    for session_date, muscle_group, weight_kg, reps in rows:
        week = iso_week_label(session_date)
        muscle_label = muscle_group.value if hasattr(muscle_group, 'value') else str(muscle_group)
        volumes[(week, muscle_label)] += float(weight_kg) * int(reps)

    return [
        {
            "week": week,
            "muscle_group": muscle_group,
            "total_volume_kg": round(total_volume, 1)
        }
        for (week, muscle_group), total_volume in sorted(volumes.items())
    ]


async def get_estimated_1rm(db: AsyncSession, user_id: int, exercise_id: int) -> Optional[Dict[str, object]]:
    start_date = date.today() - timedelta(days=30)

    stmt = select(
        Exercise.name,
        Set.weight_kg,
        Set.reps
    ).join(SessionExercise, SessionExercise.exercise_id == Exercise.id)
    stmt = stmt.join(WorkoutSession, WorkoutSession.id == SessionExercise.session_id)
    stmt = stmt.join(Set, Set.session_exercise_id == SessionExercise.id)
    stmt = stmt.where(
        WorkoutSession.user_id == user_id,
        WorkoutSession.date >= start_date,
        Exercise.id == exercise_id
    ).order_by(Set.weight_kg.desc()).limit(1)

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        return None

    exercise_name, weight_kg, reps = row
    estimated_1rm = float(weight_kg) * (1 + float(reps) / 30)
    return {
        "exercise_name": exercise_name,
        "estimated_1rm_kg": round(estimated_1rm, 1),
        "formula": "Epley"
    }


async def get_workout_streak(db: AsyncSession, user_id: int) -> Dict[str, int]:
    stmt = select(WorkoutSession.date).where(WorkoutSession.user_id == user_id).order_by(WorkoutSession.date.asc())
    result = await db.execute(stmt)
    rows = result.scalars().all()
    unique_dates = sorted({row for row in rows})

    if not unique_dates:
        return {"current_streak": 0, "longest_streak": 0}

    today = date.today()
    date_set = set(unique_dates)
    current_streak = 0
    check_date = today
    while check_date in date_set:
        current_streak += 1
        check_date -= timedelta(days=1)

    longest_streak = 0
    streak = 0
    previous_date = None
    for session_date in unique_dates:
        if previous_date is None or session_date == previous_date + timedelta(days=1):
            streak += 1
        else:
            longest_streak = max(longest_streak, streak)
            streak = 1
        previous_date = session_date
    longest_streak = max(longest_streak, streak)

    return {"current_streak": current_streak, "longest_streak": longest_streak}


async def get_muscle_group_frequency(db: AsyncSession, user_id: int, days: int = 30) -> List[Dict[str, object]]:
    if days < 1:
        days = 1
    start_date = date.today() - timedelta(days=days)

    stmt = select(
        WorkoutSession.id,
        Exercise.muscle_group,
        func.count(Set.id).label("sets_count")
    ).join(SessionExercise, SessionExercise.session_id == WorkoutSession.id)
    stmt = stmt.join(Exercise, Exercise.id == SessionExercise.exercise_id)
    stmt = stmt.join(Set, Set.session_exercise_id == SessionExercise.id)
    stmt = stmt.where(
        WorkoutSession.user_id == user_id,
        WorkoutSession.date >= start_date
    ).group_by(WorkoutSession.id, Exercise.muscle_group)

    result = await db.execute(stmt)
    rows = result.all()

    groups: Dict[str, Dict[str, float]] = defaultdict(lambda: {"sessions": 0.0, "sets": 0.0})
    for _, muscle_group, sets_count in rows:
        muscle_label = muscle_group.value if hasattr(muscle_group, 'value') else str(muscle_group)
        groups[muscle_label]["sessions"] += 1
        groups[muscle_label]["sets"] += float(sets_count)

    return [
        {
            "muscle_group": muscle_label,
            "sessions_count": int(values["sessions"]),
            "avg_sets_per_session": round(values["sets"] / values["sessions"], 1) if values["sessions"] else 0.0
        }
        for muscle_label, values in sorted(groups.items())
    ]


async def get_progressive_overload(db: AsyncSession, user_id: int, exercise_id: int, weeks: int = 8) -> List[Dict[str, object]]:
    if weeks < 1:
        weeks = 1
    end_date = date.today()
    start_date = end_date - timedelta(weeks=weeks)

    stmt = select(
        WorkoutSession.date,
        Set.weight_kg,
        Set.reps
    ).join(SessionExercise, SessionExercise.session_id == WorkoutSession.id)
    stmt = stmt.join(Set, Set.session_exercise_id == SessionExercise.id)
    stmt = stmt.where(
        WorkoutSession.user_id == user_id,
        WorkoutSession.date >= start_date,
        WorkoutSession.date <= end_date,
        SessionExercise.exercise_id == exercise_id
    )

    result = await db.execute(stmt)
    rows = result.all()

    weeks_list = _week_period_labels(start_date, end_date)
    week_stats: Dict[str, Dict[str, float]] = {week: {"max_weight": 0.0, "total_volume": 0.0} for week in weeks_list}

    for session_date, weight_kg, reps in rows:
        week = iso_week_label(session_date)
        stats = week_stats.get(week)
        if stats is None:
            continue
        stats["max_weight"] = max(stats["max_weight"], float(weight_kg))
        stats["total_volume"] += float(weight_kg) * int(reps)

    results: List[Dict[str, object]] = []
    weights = [week_stats[week]["max_weight"] for week in weeks_list]
    for idx, week in enumerate(weeks_list):
        results.append({
            "week": week,
            "max_weight_kg": round(week_stats[week]["max_weight"], 1),
            "total_volume_kg": round(week_stats[week]["total_volume"], 1),
            "stalling": False
        })

    for idx in range(2, len(results)):
        if results[idx]["max_weight_kg"] <= results[idx - 1]["max_weight_kg"] <= results[idx - 2]["max_weight_kg"]:
            results[idx]["stalling"] = True

    return results

