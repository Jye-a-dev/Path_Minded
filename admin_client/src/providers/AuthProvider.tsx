import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthContext";
import { api } from "../services/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem("admin_token");
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem("admin_user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch {
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_user");
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    const hasAccessToken = !!sessionStorage.getItem("admin_token");
    const hasRefreshToken = !!localStorage.getItem("admin_refresh_token");
    return !hasAccessToken && hasRefreshToken;
  });

  const login = (newToken: string, newRefreshToken: string, newUser: User) => {
    sessionStorage.setItem("admin_token", newToken);
    localStorage.setItem("admin_refresh_token", newRefreshToken);
    sessionStorage.setItem("admin_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    sessionStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    sessionStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const hasAccessToken = !!sessionStorage.getItem("admin_token");
      const refreshToken = localStorage.getItem("admin_refresh_token");

      if (!hasAccessToken && refreshToken) {
        try {
          const response = await api.post("/auth/refresh", { refreshToken });
          if (response.data?.accessToken && response.data?.user) {
            login(
              response.data.accessToken,
              response.data.refreshToken || refreshToken,
              response.data.user
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
