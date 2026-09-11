from datetime import date, time, timedelta

from sqlalchemy.orm import Session

from app.models import Appointment, AppointmentStatus

today = date.today()
tomorrow = today + timedelta(days=1)
day_after = today + timedelta(days=2)

SAMPLE_APPOINTMENTS = [
    dict(
        title="Client onboarding call",
        description="Walk through project scope with the new client.",
        date=today,
        start_time=time(9, 0),
        end_time=time(9, 30),
        status=AppointmentStatus.scheduled,
    ),
    dict(
        title="Design review",
        description="Review homepage mockups with the design team.",
        date=today,
        start_time=time(11, 0),
        end_time=time(12, 0),
        status=AppointmentStatus.scheduled,
    ),
    dict(
        title="Standup",
        description="Daily team sync.",
        date=today,
        start_time=time(9, 30),
        end_time=time(9, 45),
        status=AppointmentStatus.completed,
    ),
    dict(
        title="Vendor call",
        description="Discuss contract renewal terms.",
        date=today,
        start_time=time(14, 0),
        end_time=time(14, 30),
        status=AppointmentStatus.cancelled,
    ),
    dict(
        title="1:1 with manager",
        description="Monthly check-in.",
        date=tomorrow,
        start_time=time(10, 0),
        end_time=time(10, 30),
        status=AppointmentStatus.scheduled,
    ),
    dict(
        title="Portfolio review",
        description="Walk through Q3 deliverables with stakeholders.",
        date=day_after,
        start_time=time(13, 0),
        end_time=time(13, 45),
        status=AppointmentStatus.scheduled,
    ),
]


def seed_if_empty(db: Session):
    if db.query(Appointment).first():
        return
    for data in SAMPLE_APPOINTMENTS:
        db.add(Appointment(**data))
    db.commit()
