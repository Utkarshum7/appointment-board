from typing import Optional

from sqlalchemy.orm import Session

from app.models import Appointment, AppointmentStatus
from app.schemas import AppointmentCreate, AppointmentUpdate


def find_conflict(
    db: Session,
    date,
    start_time,
    end_time,
    exclude_id: Optional[str] = None,
) -> Optional[Appointment]:
    """Return an existing appointment that overlaps the given slot, or None.

    Two slots overlap when one starts before the other ends, on both sides:
    A.start < B.end AND A.end > B.start. Appointments touching at the boundary
    (one ends exactly when the other starts) do not overlap.

    Cancelled appointments are excluded: cancelling frees up the slot.
    """
    query = db.query(Appointment).filter(
        Appointment.date == date,
        Appointment.status != AppointmentStatus.cancelled,
        Appointment.start_time < end_time,
        Appointment.end_time > start_time,
    )
    if exclude_id:
        query = query.filter(Appointment.id != exclude_id)
    return query.first()


def get_appointments(db: Session, date=None, status=None):
    query = db.query(Appointment)
    if date is not None:
        query = query.filter(Appointment.date == date)
    if status is not None:
        query = query.filter(Appointment.status == status)
    return query.order_by(Appointment.date, Appointment.start_time).all()


def get_appointment(db: Session, appointment_id: str) -> Optional[Appointment]:
    return db.query(Appointment).filter(Appointment.id == appointment_id).first()


def create_appointment(db: Session, data: AppointmentCreate) -> Appointment:
    appointment = Appointment(**data.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def update_appointment(
    db: Session, appointment: Appointment, data: AppointmentUpdate
) -> Appointment:
    for field, value in data.model_dump().items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment


def set_status(
    db: Session, appointment: Appointment, status: AppointmentStatus
) -> Appointment:
    appointment.status = status
    db.commit()
    db.refresh(appointment)
    return appointment
