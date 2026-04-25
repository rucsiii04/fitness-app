import api from "./client.js";

export const getMyGyms = () =>
  api.get("/gym-admin/gyms");

export const createGym = (data) =>
  api.post("/gym-admin/gym", data);

export const updateGym = (gymId, data) =>
  api.put(`/gym-admin/gym/${gymId}`, data);

export const deleteGym = (gymId) =>
  api.delete(`/gym-admin/gym/${gymId}`);

export const createTrainer = (data) =>
  api.post("/gym-admin/trainers", data);

export const updateTrainer = (trainerId, data) =>
  api.put(`/gym-admin/trainers/${trainerId}`, data);

export const deleteTrainer = (trainerId) =>
  api.delete(`/gym-admin/trainers/${trainerId}`);

export const setGymAlert = (gymId, data) =>
  api.put(`/gym-admin/gym/${gymId}/alert`, data);

export const getTrainersByGym = (gymId) =>
  api.get(`/trainer/gyms/${gymId}/trainers`);

export const getAttendanceStats = (gymId, date) =>
  api.get(`/gym-admin/gyms/${gymId}/attendance/stats${date ? `?date=${date}` : ""}`);

export const getRevenueStats = (gymId) =>
  api.get(`/gym-admin/gyms/${gymId}/revenue/stats`);

export const exportMemberships = (gymId) =>
  api.get(`/gym-admin/gyms/${gymId}/export/memberships`, { responseType: "blob" });

export const exportUsers = (gymId) =>
  api.get(`/gym-admin/gyms/${gymId}/export/users`, { responseType: "blob" });

export const exportCheckins = (gymId, from, to) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return api.get(`/gym-admin/gyms/${gymId}/export/checkins${qs ? `?${qs}` : ""}`, {
    responseType: "blob",
  });
};
