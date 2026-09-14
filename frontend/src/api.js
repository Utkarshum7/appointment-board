const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// Generous on purpose: a free-tier backend that has spun down from inactivity can take up to
// ~50s to wake on its first request. This bounds the wait so the UI never hangs forever, while
// still giving a real cold start time to finish instead of failing it prematurely.
const REQUEST_TIMEOUT_MS = 45000;

function extractErrorMessage(data) {
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((issue) => issue.msg).join("; ");
  }
  return "Something went wrong. Please try again.";
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        "The server is taking too long to respond. It may be waking up from the free " +
          "tier's idle sleep — please try again in a moment."
      );
    }
    throw new Error("Could not reach the server. Is the backend running?");
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }
  return data;
}

function toQueryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const asString = query.toString();
  return asString ? `?${asString}` : "";
}

export const api = {
  list(filters = {}) {
    return request(`/appointments${toQueryString(filters)}`);
  },
  create(data) {
    return request("/appointments", { method: "POST", body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  cancel(id) {
    return request(`/appointments/${id}/cancel`, { method: "PATCH" });
  },
  complete(id) {
    return request(`/appointments/${id}/complete`, { method: "PATCH" });
  },
};
