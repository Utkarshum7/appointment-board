import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import crud
from app.database import Base, SessionLocal, engine, get_db
from app.models import AppointmentStatus
from app.schemas import AppointmentCreate, AppointmentOut, AppointmentUpdate
from app.seed import seed_if_empty

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Appointment Board API", lifespan=lifespan)

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/appointments", response_model=list[AppointmentOut])
def list_appointments(
    date: str | None = None,
    status: AppointmentStatus | None = None,
    db: Session = Depends(get_db),
):
    parsed_date = None
    if date:
        from datetime import date as date_cls

        try:
            parsed_date = date_cls.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format")
    return crud.get_appointments(db, date=parsed_date, status=status)


@app.get("/appointments/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: str, db: Session = Depends(get_db)):
    appointment = crud.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@app.post("/appointments", response_model=AppointmentOut, status_code=201)
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    conflict = crud.find_conflict(db, data.date, data.start_time, data.end_time)
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Time slot conflicts with existing appointment '{conflict.title}' "
            f"({conflict.start_time.strftime('%H:%M')}-{conflict.end_time.strftime('%H:%M')})",
        )
    return crud.create_appointment(db, data)


@app.put("/appointments/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str, data: AppointmentUpdate, db: Session = Depends(get_db)
):
    appointment = crud.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.status != AppointmentStatus.scheduled:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot edit an appointment that is already {appointment.status.value}",
        )
    conflict = crud.find_conflict(
        db, data.date, data.start_time, data.end_time, exclude_id=appointment_id
    )
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Time slot conflicts with existing appointment '{conflict.title}' "
            f"({conflict.start_time.strftime('%H:%M')}-{conflict.end_time.strftime('%H:%M')})",
        )
    return crud.update_appointment(db, appointment, data)


@app.patch("/appointments/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(appointment_id: str, db: Session = Depends(get_db)):
    appointment = crud.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.status == AppointmentStatus.completed:
        raise HTTPException(status_code=409, detail="Cannot cancel a completed appointment")
    if appointment.status == AppointmentStatus.cancelled:
        raise HTTPException(status_code=409, detail="Appointment is already cancelled")
    return crud.set_status(db, appointment, AppointmentStatus.cancelled)


@app.patch("/appointments/{appointment_id}/complete", response_model=AppointmentOut)
def complete_appointment(appointment_id: str, db: Session = Depends(get_db)):
    appointment = crud.get_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.status != AppointmentStatus.scheduled:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot complete an appointment that is {appointment.status.value}",
        )
    return crud.set_status(db, appointment, AppointmentStatus.completed)
