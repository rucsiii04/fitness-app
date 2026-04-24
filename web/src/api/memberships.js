import api from "./client.js";

export const getMembershipTypesByGym = (gymId) =>
  api.get(`/memberships/gyms/${gymId}/types`);

export const getMembershipTypesForAdmin = (gymId) =>
  api.get(`/memberships/gyms/${gymId}/manage/types`);

export const createMembershipType = (data) =>
  api.post("/memberships/types", data);

export const updateMembershipType = (typeId, data) =>
  api.put(`/memberships/types/${typeId}`, data);

export const issueMembership = (data) =>
  api.post("/memberships/issue", data);

export const cancelMembership = (membershipId) =>
  api.delete(`/memberships/${membershipId}`);

export const pauseGymMemberships = (gymId, data) =>
  api.post(`/memberships/gyms/${gymId}/pause-memberships`, data);
