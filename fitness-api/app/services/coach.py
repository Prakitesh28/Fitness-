from __future__ import annotations
from collections import defaultdict
from datetime import date, timedelta
from typing import Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models import WorkoutSession, SessionExercise


def iso_week_label(d: date) -> str:
    year, week, _ = d.isocalendar()
    return f"{year}-{week:02d}"


class CoachEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def analyse(self, user_id: int) -> Dict[str, object]:
        end_date = date.today()
        start_date = end_date - timedelta(weeks=6)

        stmt = select(WorkoutSession).where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.date >= start_date,
            WorkoutSession.date <= end_date
        ).options(
            selectinload(WorkoutSession.session_exercises)
            .selectinload(SessionExercise.exercise),
            selectinload(WorkoutSession.session_exercises)
            .selectinload(SessionExercise.sets)
        ).order_by(WorkoutSession.date.asc())

        result = await self.db.execute(stmt)
        sessions = result.scalars().all()

        muscle_session_count: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        muscle_volume_by_week: Dict[tuple[str, str], float] = defaultdict(float)
        exercise_history: Dict[str, Dict[str, Dict[str, float]]] = defaultdict(lambda: defaultdict(lambda: {"max_weight": 0.0, "max_reps": 0, "total_volume": 0.0}))
        session_dates = set()
        week_labels = set()
        push_volume = 0.0
        pull_volume = 0.0
        total_sessions = 0

        for session in sessions:
            total_sessions += 1
            session_dates.add(session.date)
            week = iso_week_label(session.date)
            week_labels.add(week)
            seen_muscles = set()

            for session_exercise in session.session_exercises:
                exercise = session_exercise.exercise
                if exercise is None:
                    continue
                muscle_group = exercise.muscle_group.value if hasattr(exercise.muscle_group, 'value') else str(exercise.muscle_group)
                seen_muscles.add(muscle_group)

                for set_item in session_exercise.sets:
                    volume = float(set_item.weight_kg) * int(set_item.reps)
                    muscle_volume_by_week[(week, muscle_group)] += volume
                    if muscle_group == 'push':
                        push_volume += volume
                    elif muscle_group == 'pull':
                        pull_volume += volume

                    record = exercise_history[exercise.name][week]
                    record['max_weight'] = max(record['max_weight'], float(set_item.weight_kg))
                    record['max_reps'] = max(record['max_reps'], int(set_item.reps))
                    record['total_volume'] += volume

            for muscle_group in seen_muscles:
                muscle_session_count[muscle_group][week] += 1

        all_weeks = sorted(week_labels)
        if not all_weeks:
            return {
                "summary": "No workout data found in the last 6 weeks.",
                "suggestions": [],
                "deload_recommended": False,
                "deload_reason": None,
                "stalling_exercises": [],
                "analysed_weeks": 6
            }

        suggestions = []
        stalling_exercises = []
        deload_recommended = False
        deload_reason = None

        # Volume frequency
        analysed_weeks = max(1, len(all_weeks))
        for muscle_group, weeks_data in muscle_session_count.items():
            avg_frequency = sum(weeks_data.values()) / analysed_weeks
            if avg_frequency < 2.0:
                suggestions.append({
                    "area": f"{muscle_group.capitalize()} frequency",
                    "advice": f"Your {muscle_group} frequency is low. Aim for 2+ sessions per week.",
                    "priority": "medium"
                })

        # Volume dips
        for muscle_group in {mg for mg, _ in muscle_volume_by_week.keys()}:
            week_volumes = []
            for week in all_weeks:
                week_volumes.append(muscle_volume_by_week.get((week, muscle_group), 0.0))
            for i in range(1, len(week_volumes)):
                previous = week_volumes[i - 1]
                current = week_volumes[i]
                if previous > 0 and current < previous * 0.8:
                    suggestions.append({
                        "area": f"{muscle_group.capitalize()} volume",
                        "advice": f"Volume dip detected on {muscle_group}. Check recovery or increase sets.",
                        "priority": "medium"
                    })
                    break

        if pull_volume > 0 and push_volume / pull_volume > 1.3:
            suggestions.append({
                "area": "Push/Pull balance",
                "advice": "Push/Pull imbalance detected. Add more pulling work to protect shoulders.",
                "priority": "high"
            })

        # Progressive overload
        for exercise_name, week_data in exercise_history.items():
            weeks_sorted = sorted(week_data.keys())
            if len(weeks_sorted) >= 4:
                last_week = weeks_sorted[-1]
                three_weeks_ago = weeks_sorted[-4]
                current_record = week_data[last_week]
                prior_record = week_data[three_weeks_ago]
                if current_record['max_weight'] <= prior_record['max_weight'] and current_record['max_reps'] <= prior_record['max_reps']:
                    if exercise_name not in stalling_exercises:
                        stalling_exercises.append(exercise_name)

            for idx in range(1, len(weeks_sorted)):
                current = week_data[weeks_sorted[idx]]
                previous = week_data[weeks_sorted[idx - 1]]
                if previous['max_weight'] > 0 and current['max_weight'] > previous['max_weight'] * 1.1:
                    suggestions.append({
                        "area": f"{exercise_name} progression",
                        "advice": f"Large weight jump on {exercise_name}. Ensure form is solid before progressing further.",
                        "priority": "low"
                    })
                    break

        # Recovery rules
        sorted_dates = sorted(session_dates)
        longest_run = 0
        current_run = 0
        previous_date = None
        for session_date in sorted_dates:
            if previous_date is None or session_date == previous_date + timedelta(days=1):
                current_run += 1
            else:
                longest_run = max(longest_run, current_run)
                current_run = 1
            previous_date = session_date
        longest_run = max(longest_run, current_run)
        if longest_run >= 6:
            deload_recommended = True
            deload_reason = "6+ consecutive training days detected. Schedule a rest day or deload week."

        # Frequency spike this week
        current_week = iso_week_label(end_date)
        past_weeks = [w for w in all_weeks if w != current_week]
        if past_weeks:
            current_week_sessions = sum(1 for session in sessions if iso_week_label(session.date) == current_week)
            avg_past_4 = 0.0
            last_four = past_weeks[-4:]
            if last_four:
                avg_past_4 = sum(sum(1 for session in sessions if iso_week_label(session.date) == week) for week in last_four) / len(last_four)
            if avg_past_4 > 0 and current_week_sessions > avg_past_4 * 1.5:
                suggestions.append({
                    "area": "Recovery",
                    "advice": "Training frequency spike this week. Monitor fatigue.",
                    "priority": "medium"
                })

        # Consistency
        total_sessions = len(sessions)
        average_sessions = total_sessions / analysed_weeks if analysed_weeks > 0 else 0
        current_week_sessions = sum(1 for session in sessions if iso_week_label(session.date) == current_week)
        if round(average_sessions) - current_week_sessions > 3:
            suggestions.append({
                "area": "Consistency",
                "advice": "Consistency dropped this week. Even a short session beats skipping.",
                "priority": "low"
            })
        if current_run < 3:
            suggestions.append({
                "area": "Momentum",
                "advice": "Build momentum. Hit 3 sessions this week to establish a streak.",
                "priority": "low"
            })

        if stalling_exercises:
            suggestions.append({
                "area": "Stalling",
                "advice": "You've stalled on some lifts. Try a small progression next session.",
                "priority": "high"
            })

        summary = "Your training data was reviewed over the last 6 weeks."
        if suggestions:
            summary = "A few areas stand out from your recent training, including recovery and progression."
        else:
            summary = "Your recent training appears consistent and balanced. Keep it up."

        return {
            "summary": summary,
            "suggestions": suggestions,
            "deload_recommended": deload_recommended,
            "deload_reason": deload_reason,
            "stalling_exercises": sorted(set(stalling_exercises)),
            "analysed_weeks": 6
        }

