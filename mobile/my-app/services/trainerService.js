const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export async function fetchTrainersByGym(gymId, token) {
  const res = await fetch(`${API_BASE}/trainer/gyms/${gymId}/trainers`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load trainers");
  return res.json();
}

export async function fetchClientInbox(token) {
  const res = await fetch(`${API_BASE}/trainer/trainer-assignments/client-inbox`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load requests");
  return res.json();
}

export async function sendTrainerRequest(targetUserId, token) {
  const res = await fetch(`${API_BASE}/trainer/trainer-assignments`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ targetUserId }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to send request");
  return body;
}

export async function endTrainerCollaboration(token) {
  const res = await fetch(`${API_BASE}/trainer/trainer-assignments/end`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to end collaboration");
  return body;
}
