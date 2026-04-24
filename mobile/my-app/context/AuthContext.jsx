import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");

        if (storedToken) {
          setToken(storedToken);

          try {
            const res = await api.get("/auth/me");

            const freshUser = res.data;

            await AsyncStorage.setItem("user", JSON.stringify(freshUser));
            setUser(freshUser);
          } catch (err) {
            if (storedUser) setUser(JSON.parse(storedUser));
          }
        }
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (tokenValue, userData) => {
    try {
      await AsyncStorage.setItem("token", tokenValue);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setToken(tokenValue);
      setUser(userData);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);

      setToken(null);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const res = await api.get("/auth/me");

      const freshUser = res.data;

      await AsyncStorage.setItem("user", JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (err) {
      console.log("Failed to refresh user");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
