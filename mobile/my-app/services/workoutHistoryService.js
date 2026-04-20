const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export async function fetchSessionHistory(token) {
  const res = await fetch(`${API_BASE}/workout-sessions`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to load history");
  const data = await res.json();
  return Array.isArray(data)
    ? data.filter((s) => s.finished_at != null).slice(0, 10)
    : [];
}

export async function fetchSessionLogs(sessionId, token) {
  const res = await fetch(`${API_BASE}/workout-sessions/${sessionId}/logs`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to load logs");
  return res.json();
}
