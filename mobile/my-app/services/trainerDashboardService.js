const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export async function fetchDashboardStats(token) {
  const res = await fetch(`${API_BASE}/trainer/dashboard-stats`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load dashboard stats");
  return res.json();
}

export async function fetchClientsWithDetails(token) {
  const res = await fetch(`${API_BASE}/trainer/me/clients-details`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load clients");
  return res.json();
}

export async function fetchTrainerInbox(token) {
  const res = await fetch(`${API_BASE}/trainer/trainer-assignments/inbox`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load inbox");
  return res.json();
}

export async function respondToRequest(requestId, action, token) {
  const res = await fetch(`${API_BASE}/trainer/trainer-assignments/${requestId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ action }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to respond");
  return body;
}

export async function fetchTrainerProfile(token) {
  const res = await fetch(`${API_BASE}/trainer/profil`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export async function updateTrainerProfile(data, token) {
  const res = await fetch(`${API_BASE}/trainer/profil`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to update profile");
  return body;
}

export async function endTrainingWithClient(clientId, token) {
  const res = await fetch(`${API_BASE}/trainer/trainer-assignments/end/${clientId}`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to end training");
  return body;
}
