"use client";

import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthContext";
import { api } from "../services/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (
    newToken: string,
    newRefreshToken: string,
    newUser: User,
    remember: boolean = false
  ) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("user_token", newToken);
      sessionStorage.setItem("user_user", JSON.stringify(newUser));

      if (remember) {
        localStorage.setItem("user_remember", "true");
        localStorage.setItem("user_refresh_token", newRefreshToken);
        sessionStorage.removeItem("user_refresh_token");
      } else {
        localStorage.removeItem("user_remember");
        localStorage.removeItem("user_refresh_token");
        sessionStorage.setItem("user_refresh_token", newRefreshToken);
      }
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("user_token");
      sessionStorage.removeItem("user_user");
      sessionStorage.removeItem("user_refresh_token");
      localStorage.removeItem("user_refresh_token");
      localStorage.removeItem("user_remember");
    }
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") return;

      const storedToken = sessionStorage.getItem("user_token");
      const storedUserStr = sessionStorage.getItem("user_user");
      const refreshToken =
        localStorage.getItem("user_refresh_token") ||
        sessionStorage.getItem("user_refresh_token");

      let hasAccessToken = false;
      if (storedToken && storedUserStr) {
        try {
          const parsedUser = JSON.parse(storedUserStr) as User;
          setToken(storedToken);
          setUser(parsedUser);
          hasAccessToken = true;
        } catch {
          sessionStorage.removeItem("user_token");
          sessionStorage.removeItem("user_user");
        }
      }

      if (!hasAccessToken && refreshToken) {
        try {
          const response = await api.post("/auth/refresh", { refreshToken });
          if (response.data?.accessToken && response.data?.user) {
            const remember = localStorage.getItem("user_remember") === "true";
            login(
              response.data.accessToken,
              response.data.refreshToken || refreshToken,
              response.data.user,
              remember
            );
          } else {
            logout();
          }
        } catch (error) {
          console.error("Failed to refresh session on mount:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
