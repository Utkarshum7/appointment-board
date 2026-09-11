import { useEffect, useState } from "react";
import { api } from "./api";
import Board from "./components/Board";
import Filters from "./components/Filters";
import AppointmentForm from "./components/AppointmentForm";
import Toast from "./components/Toast";

const emptyFilters = { date: "", status: "" };

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [formState, setFormState] = useState(null); // { mode: "add" | "edit", appointment? }
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  async function loadAppointments() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api.list(filters);
      setAppointments(data);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleCreate(data) {
    setSubmitting(true);
    try {
      await api.create(data);
      setFormState(null);
      showToast("success", "Appointment created.");
      await loadAppointments();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(data) {
    setSubmitting(true);
    try {
      await api.update(formState.appointment.id, data);
      setFormState(null);
      showToast("success", "Appointment updated.");
      await loadAppointments();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(appointment) {
    if (!window.confirm(`Cancel "${appointment.title}"? This cannot be undone.`)) return;
    setBusyId(appointment.id);
    try {
      await api.cancel(appointment.id);
      showToast("success", "Appointment cancelled.");
      await loadAppointments();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleComplete(appointment) {
    setBusyId(appointment.id);
    try {
      await api.complete(appointment.id);
      showToast("success", "Appointment marked as completed.");
      await loadAppointments();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Appointment Board</h1>
        <button type="button" className="btn-primary" onClick={() => setFormState({ mode: "add" })}>
          Add Appointment
        </button>
      </header>

      <Filters filters={filters} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />

      <Board
        appointments={appointments}
        loading={loading}
        error={loadError}
        onEdit={(appointment) => setFormState({ mode: "edit", appointment })}
        onCancel={handleCancel}
        onComplete={handleComplete}
        busyId={busyId}
      />

      {formState && (
        <AppointmentForm
          initialValues={formState.mode === "edit" ? formState.appointment : null}
          onSubmit={formState.mode === "edit" ? handleUpdate : handleCreate}
          onCancel={() => setFormState(null)}
          submitting={submitting}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
