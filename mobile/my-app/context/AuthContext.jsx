import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import { connectSocket, disconnectSocket } from "@/services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(null);

  useEffect(() => {
    if (user?.user_id) connectSocket(user.user_id);
  }, [user?.user_id]);

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

            if (freshUser.role === "client") {
              try {
                await api.get("/profile");
                setProfileComplete(true);
              } catch (e) {
                setProfileComplete(e?.response?.status === 404 ? false : true);
              }
            } else {
              setProfileComplete(true);
            }
          } catch (err) {
            if (storedUser) setUser(JSON.parse(storedUser));
            setProfileComplete(true);
          }
        } else {
          setProfileComplete(true);
        }
      } catch (err) {
        console.error("Failed to load session", err);
        setProfileComplete(true);
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

      if (userData.role === "client") {
        try {
          await api.get("/profile");
          setProfileComplete(true);
        } catch (e) {
          setProfileComplete(e?.response?.status === 404 ? false : true);
        }
      } else {
        setProfileComplete(true);
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const logout = async () => {
    try {
      disconnectSocket();
      await AsyncStorage.multiRemove(["token", "user"]);

      setToken(null);
      setUser(null);
      setProfileComplete(true);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const markProfileComplete = () => setProfileComplete(true);

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
      value={{ user, token, login, logout, loading, refreshUser, profileComplete, markProfileComplete }}
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
