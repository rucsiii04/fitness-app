import api from "./client.js";

export const getClassTypesByGym = (gymId) =>
  api.get(`/classes/gyms/${gymId}/class-types`);

export const createClassType = (data) =>
  api.post("/classes/class-types", data);

export const getSessionsByGym = (gymId) =>
  api.get(`/classes/gyms/${gymId}/class-sessions`);

export const createClassSession = (data) =>
  api.post("/classes/class-sessions", data);

export const cancelClassSession = (sessionId) =>
  api.patch(`/classes/class-sessions/${sessionId}/cancel`);

export const getSessionEnrollments = (sessionId) =>
  api.get(`/classes/class-sessions/${sessionId}/enrollments`);

export const markAttendance = (enrollmentId, data) =>
  api.patch(`/classes/enrollments/${enrollmentId}/attendance`, data);
