import { useEffect, useRef, useState } from "react";

const emptyForm = {
  title: "",
  description: "",
  date: "",
  start_time: "",
  end_time: "",
};

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.date) errors.date = "Date is required";
  if (!form.start_time) errors.start_time = "Start time is required";
  if (!form.end_time) errors.end_time = "End time is required";
  if (form.start_time && form.end_time && form.end_time <= form.start_time) {
    errors.end_time = "End time must be after start time";
  }
  return errors;
}

export default function AppointmentForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(initialValues || emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const isEditing = Boolean(initialValues);
  const titleInputRef = useRef(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    setFormError("");
    if (Object.keys(errors).length > 0) return;

    try {
      await onSubmit(form);
    } catch (err) {
      setFormError(err.message);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-form-title">
        <h2 id="appointment-form-title">{isEditing ? "Edit Appointment" : "Add Appointment"}</h2>
        <p className="modal-hint">Fields marked * are required.</p>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              ref={titleInputRef}
              type="text"
              placeholder="e.g. Client onboarding call"
              maxLength={200}
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? "title-error" : undefined}
            />
            {fieldErrors.title && (
              <span id="title-error" className="field-error">
                {fieldErrors.title}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              placeholder="Any extra detail worth noting"
              maxLength={2000}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              disabled={submitting}
              rows={3}
            />
          </div>

          <div className="form-field">
            <label htmlFor="date">Date *</label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.date)}
              aria-describedby={fieldErrors.date ? "date-error" : undefined}
            />
            {fieldErrors.date && (
              <span id="date-error" className="field-error">
                {fieldErrors.date}
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="start_time">Start time *</label>
              <input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(e) => updateField("start_time", e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.start_time)}
                aria-describedby={fieldErrors.start_time ? "start-time-error" : undefined}
              />
              {fieldErrors.start_time && (
                <span id="start-time-error" className="field-error">
                  {fieldErrors.start_time}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="end_time">End time *</label>
              <input
                id="end_time"
                type="time"
                value={form.end_time}
                onChange={(e) => updateField("end_time", e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.end_time)}
                aria-describedby={fieldErrors.end_time ? "end-time-error" : undefined}
              />
              {fieldErrors.end_time && (
                <span id="end-time-error" className="field-error">
                  {fieldErrors.end_time}
                </span>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Add appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
