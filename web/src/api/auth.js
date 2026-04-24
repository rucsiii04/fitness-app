import api from "./client.js";

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const me = () => api.get("/auth/me");

export const requestPasswordReset = (email) =>
  api.post("/auth/request-reset-password", { email });

export const resetPasswordWithToken = (userId, token, newPassword) =>
  api.post("/auth/reset-password", { userId, token, newPassword });

export const verifyOtp = (email, otp) =>
  api.post("/auth/verify-otp", { email, otp });

export const resetPasswordWithOtp = (userId, otp, newPassword) =>
  api.post("/auth/reset-password-otp", { userId, otp, newPassword });

export const updatePassword = (oldPassword, newPassword) =>
  api.put("/auth/update-password", { oldPassword, newPassword });
