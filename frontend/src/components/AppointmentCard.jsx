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

const STATUS_LABELS = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AppointmentCard({ appointment, onEdit, onCancel, onComplete, busyAction }) {
  const { title, description, date, start_time, end_time, status } = appointment;
  const canAct = status === "scheduled";
  const isBusy = Boolean(busyAction);

  return (
    <article className={`appointment-card status-${status}`} aria-label={title}>
      <div className="appointment-card-header">
        <h3>{title}</h3>
        <span className={`status-badge status-${status}`}>{STATUS_LABELS[status]}</span>
      </div>

      {description && <p className="appointment-description">{description}</p>}

      <div className="appointment-meta">
        <span>{formatDate(date)}</span>
        <span>
          {formatTime(start_time)} – {formatTime(end_time)}
        </span>
      </div>

      {canAct && (
        <div className="appointment-actions">
          <button type="button" onClick={() => onEdit(appointment)} disabled={isBusy}>
            Edit
          </button>
          <button type="button" onClick={() => onComplete(appointment)} disabled={isBusy}>
            {busyAction === "complete" ? "Completing…" : "Complete"}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => onCancel(appointment)}
            disabled={isBusy}
          >
            {busyAction === "cancel" ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      )}
    </article>
  );
}
