import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import Board from "./components/Board";
import Filters from "./components/Filters";
import AppointmentForm from "./components/AppointmentForm";
import Toast from "./components/Toast";
import ThemeToggle from "./components/ThemeToggle";
import BackgroundDecoration from "./components/BackgroundDecoration";
import { useTheme } from "./useTheme";

const emptyFilters = { date: "", status: "" };

// How long a load can run before we tell the user it might be a free-tier cold start,
// rather than leaving a generic spinner up with no explanation.
const SLOW_LOAD_HINT_MS = 6000;

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [formState, setFormState] = useState(null); // { mode: "add" | "edit", appointment? }
  const [submitting, setSubmitting] = useState(false);
  const [busyAction, setBusyAction] = useState(null); // { id, action: "cancel" | "complete" }
  const [toast, setToast] = useState(null);

  const toastTimeoutRef = useRef(null);
  const slowLoadTimeoutRef = useRef(null);
  const requestIdRef = useRef(0);

  async function loadAppointments() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setSlowLoad(false);
    setLoadError("");
    clearTimeout(slowLoadTimeoutRef.current);
    slowLoadTimeoutRef.current = setTimeout(() => {
      if (requestId === requestIdRef.current) setSlowLoad(true);
    }, SLOW_LOAD_HINT_MS);
    try {
      const data = await api.list(filters);
      if (requestId !== requestIdRef.current) return; // a newer filter change superseded this
      setAppointments(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setLoadError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setSlowLoad(false);
        clearTimeout(slowLoadTimeoutRef.current);
      }
    }
  }

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    return () => {
      clearTimeout(toastTimeoutRef.current);
      clearTimeout(slowLoadTimeoutRef.current);
    };
  }, []);

  function showToast(type, message) {
    clearTimeout(toastTimeoutRef.current);
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
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
    setBusyAction({ id: appointment.id, action: "cancel" });
    try {
      await api.cancel(appointment.id);
      showToast("success", "Appointment cancelled.");
      await loadAppointments();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyAction(null);
    }
  }

  async function handleComplete(appointment) {
    setBusyAction({ id: appointment.id, action: "complete" });
    try {
      await api.complete(appointment.id);
      showToast("success", "Appointment marked as completed.");
      await loadAppointments();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyAction(null);
    }
  }

  const hasActiveFilters = Boolean(filters.date || filters.status);

  return (
    <>
      <BackgroundDecoration />
      <div className="app">
        <header className="app-header">
          <div className="app-header-text">
            <h1>Appointment Board</h1>
            <p className="app-subtitle">Track, schedule, and manage your team's appointments.</p>
          </div>
          <div className="app-header-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              type="button"
              className="btn-primary"
              onClick={() => setFormState({ mode: "add" })}
            >
              + Add Appointment
            </button>
          </div>
        </header>

        <Filters filters={filters} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />

        <Board
          appointments={appointments}
          loading={loading}
          slowLoad={slowLoad}
          error={loadError}
          hasActiveFilters={hasActiveFilters}
          onRetry={loadAppointments}
          onEdit={(appointment) => setFormState({ mode: "edit", appointment })}
          onCancel={handleCancel}
          onComplete={handleComplete}
          onClearFilters={() => setFilters(emptyFilters)}
          onAddNew={() => setFormState({ mode: "add" })}
          busyAction={busyAction}
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
    </>
  );
}
