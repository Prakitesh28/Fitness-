from celery import Celery
from celery.schedules import crontab
from app.config import settings
from app.database import AsyncSessionLocal
from app.models import User
from app.models import WorkoutSession, SessionExercise, Set, Exercise, BodyMetric
from sqlalchemy import select, func, and_
from datetime import date, datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Initialize Celery
celery_app = Celery(
    "fitness_tracker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

# Define the weekly summary task
@celery_app.task
def send_weekly_summary_email():
    """Send weekly summary email to all users every Monday at 8am"""
    # This is a simplified version - in production you'd want to handle errors better
    # and possibly batch emails

    # For now, we'll just print that the task ran
    # In a real implementation, you would:
    # 1. Get all users
    # 2. For each user, calculate their weekly stats
    # 3. Send an email with those stats

    print("Weekly summary email task executed at:", datetime.utcnow())

    # Actual implementation would go here
    # For brevity in this example, we're just showing the task structure

    return "Weekly summary task completed"

# Optional: Configure periodic tasks
# This would normally be in a separate celeryconfig.py or beat_schedule
# But we'll include it here for completeness
celery_app.conf.beat_schedule = {
    'send-weekly-summary-every-monday-8am': {
        'task': 'app.tasks.email.send_weekly_summary_email',
        'schedule': crontab(hour=8, minute=0, day_of_week=1),  # Monday 8am
    },
}
