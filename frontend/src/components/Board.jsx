import AppointmentCard from "./AppointmentCard";

export default function Board({ appointments, loading, error, onEdit, onCancel, onComplete, busyId }) {
  if (loading) {
    return <p className="board-message">Loading appointments…</p>;
  }

  if (error) {
    return <p className="board-message board-error">{error}</p>;
  }

  if (appointments.length === 0) {
    return <p className="board-message">No appointments match the current filters.</p>;
  }

  return (
    <div className="board-grid">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onEdit={onEdit}
          onCancel={onCancel}
          onComplete={onComplete}
          busy={busyId === appointment.id}
        />
      ))}
    </div>
  );
}
