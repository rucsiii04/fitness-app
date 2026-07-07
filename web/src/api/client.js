import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kn.token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("kn.token");
      // Avoid a pointless hard reload while already on the login page - it
      // wipes out any error the login form is showing (e.g. from a stale
      // token check racing with an in-progress login attempt) and looks like
      // the error "flashes and disappears" for no reason.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
