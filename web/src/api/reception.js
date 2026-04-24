import api from "./client.js";

export const scanQR = (token) => api.post("/qr/scan", { token });

export const searchClients = (q, gymId) =>
  api.get("/memberships/clients/search", { params: { q, gym_id: gymId } });
