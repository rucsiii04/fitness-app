import React, { createContext, useContext, useState, useEffect } from "react";
import { me } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kn.token");
    if (!token) {
      setLoading(false);
      return;
    }
    me()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("kn.token"))
      .finally(() => setLoading(false));
  }, []);

  const signIn = (token, userData) => {
    localStorage.setItem("kn.token", token);
    setUser(userData);
  };

  const signOut = () => {
    localStorage.removeItem("kn.token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
