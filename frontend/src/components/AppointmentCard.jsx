function formatTime(value) {
  return value.slice(0, 5);
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function AppointmentCard({ appointment, onEdit, onCancel, onComplete, busy }) {
  const { title, description, date, start_time, end_time, status } = appointment;
  const canEdit = status === "scheduled";
  const canComplete = status === "scheduled";
  const canCancel = status === "scheduled";

  return (
    <div className={`appointment-card status-${status}`}>
      <div className="appointment-card-header">
        <h3>{title}</h3>
        <span className={`status-badge status-${status}`}>{status}</span>
      </div>

      {description && <p className="appointment-description">{description}</p>}

      <div className="appointment-meta">
        <span>{formatDate(date)}</span>
        <span>
          {formatTime(start_time)} – {formatTime(end_time)}
        </span>
      </div>

      <div className="appointment-actions">
        {canEdit && (
          <button type="button" onClick={() => onEdit(appointment)} disabled={busy}>
            Edit
          </button>
        )}
        {canComplete && (
          <button type="button" onClick={() => onComplete(appointment)} disabled={busy}>
            Complete
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            className="btn-danger"
            onClick={() => onCancel(appointment)}
            disabled={busy}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
