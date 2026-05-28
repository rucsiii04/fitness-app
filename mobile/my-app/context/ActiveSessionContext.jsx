import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AppState } from "react-native";
import { useAuth } from "./AuthContext";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const ActiveSessionContext = createContext(null);

export function ActiveSessionProvider({ children }) {
  const { token } = useAuth();
  const [activeSession, setActiveSession] = useState(null);

  // Returns a Promise so callers can await the sync
  const refresh = useCallback(() => {
    if (!token) return Promise.resolve();
    return fetch(`${API_BASE}/workout-sessions`, {
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

  // Sync on mount / token change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-sync every time the app comes back to the foreground
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        refresh();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [refresh]);

  return (
    <ActiveSessionContext.Provider value={{ activeSession, setActiveSession, refresh }}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export const useActiveSession = () =>
  useContext(ActiveSessionContext) ?? { activeSession: null, setActiveSession: () => {}, refresh: () => Promise.resolve() };
