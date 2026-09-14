import AppointmentCard from "./AppointmentCard";

export default function Board({
  appointments,
  loading,
  slowLoad,
  error,
  hasActiveFilters,
  onEdit,
  onCancel,
  onComplete,
  onRetry,
  onClearFilters,
  onAddNew,
  busyAction,
}) {
  if (loading) {
    return (
      <div className="board-message" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>
          {slowLoad
            ? "Still loading… the server may be waking up from the free tier's idle sleep. This can take up to a minute."
            : "Loading appointments…"}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-message board-error" role="alert">
        <p>{error}</p>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return hasActiveFilters ? (
      <div className="board-message">
        <p>No appointments match the selected filters.</p>
        <button type="button" onClick={onClearFilters}>
          Clear filters
        </button>
      </div>
    ) : (
      <div className="board-message">
        <p>No appointments yet.</p>
        <button type="button" className="btn-primary" onClick={onAddNew}>
          Add your first appointment
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="board-summary">
        Showing {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
      </p>
      <div className="board-grid">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onEdit={onEdit}
            onCancel={onCancel}
            onComplete={onComplete}
            busyAction={busyAction?.id === appointment.id ? busyAction.action : null}
          />
        ))}
      </div>
    </div>
  );
}
