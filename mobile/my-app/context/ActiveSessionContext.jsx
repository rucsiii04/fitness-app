import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const ActiveSessionContext = createContext(null);

export function ActiveSessionProvider({ children }) {
  const { token } = useAuth();
  const [activeSession, setActiveSession] = useState(null);

  const refresh = useCallback(() => {
    if (!token) return;
    fetch(`${API_BASE}/workout-sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const open = data.find((s) => !s.finished_at);
          setActiveSession(open ?? null);
        }
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ActiveSessionContext.Provider value={{ activeSession, setActiveSession, refresh }}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export const useActiveSession = () =>
  useContext(ActiveSessionContext) ?? { activeSession: null, setActiveSession: () => {}, refresh: () => {} };
