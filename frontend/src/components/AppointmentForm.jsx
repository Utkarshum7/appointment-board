import { useState } from "react";

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

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEditing ? "Edit Appointment" : "Add Appointment"}</h2>

        {formError && <p className="form-error">{formError}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
            {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
            />
            {fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="start_time">Start time</label>
              <input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(e) => updateField("start_time", e.target.value)}
              />
              {fieldErrors.start_time && (
                <span className="field-error">{fieldErrors.start_time}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="end_time">End time</label>
              <input
                id="end_time"
                type="time"
                value={form.end_time}
                onChange={(e) => updateField("end_time", e.target.value)}
              />
              {fieldErrors.end_time && <span className="field-error">{fieldErrors.end_time}</span>}
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
