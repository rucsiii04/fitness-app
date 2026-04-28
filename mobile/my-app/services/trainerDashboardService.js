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
  const res = await fetch(
    `${API_BASE}/trainer/trainer-assignments/${requestId}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ action }),
    },
  );
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

export async function updateTrainerProfile(data, imageUri, token) {
  const form = new FormData();
  form.append("specialization", data.specialization);
  form.append("experience_years", String(data.experience_years));
  if (data.bio) form.append("bio", data.bio);
  if (imageUri) {
    const filename = imageUri.split("/").pop();
    const ext = /\.(\w+)$/.exec(filename)?.[1] ?? "jpg";
    form.append("image", {
      uri: imageUri,
      name: filename,
      type: `image/${ext}`,
    });
  }
  const res = await fetch(`${API_BASE}/trainer/profil`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to update profile");
  return body;
}

export async function fetchClientWorkouts(clientId, token) {
  const res = await fetch(
    `${API_BASE}/trainer/me/clients/${clientId}/workouts`,
    {
      headers: authHeaders(token),
    },
  );
  if (!res.ok) throw new Error("Failed to load client workouts");
  return res.json();
}

export async function endTrainingWithClient(clientId, token) {
  const res = await fetch(
    `${API_BASE}/trainer/trainer-assignments/end/${clientId}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
    },
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to end training");
  return body;
}

export async function fetchMyPublicWorkouts(token) {
  const res = await fetch(`${API_BASE}/workouts`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load workouts");
  const all = await res.json();
  return Array.isArray(all) ? all.filter((w) => w.is_public) : [];
}

export async function deleteWorkout(workoutId, token) {
  const res = await fetch(`${API_BASE}/workouts/${workoutId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete workout");
}

export async function fetchGymSessions(gymId, token) {
  const res = await fetch(`${API_BASE}/classes/gyms/${gymId}/class-sessions`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load sessions");
  return res.json();
}

export async function fetchGymClassTypes(gymId, token) {
  const res = await fetch(`${API_BASE}/classes/gyms/${gymId}/class-types`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load class types");
  return res.json();
}

export async function createGymClassSession(data, token) {
  const res = await fetch(`${API_BASE}/classes/class-sessions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to create session");
  return body;
}

export async function fetchSessionEnrollments(sessionId, token) {
  const res = await fetch(
    `${API_BASE}/classes/class-sessions/${sessionId}/enrollments`,
    { headers: authHeaders(token) },
  );
  if (!res.ok) throw new Error("Failed to load enrollments");
  return res.json();
}

export async function markAttendance(enrollmentId, status, token) {
  const res = await fetch(
    `${API_BASE}/classes/enrollments/${enrollmentId}/attendance`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    },
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Failed to mark attendance");
  return body;
}
