import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthContext";
import { api } from "../services/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem("user_token");
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem("user_user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch {
        sessionStorage.removeItem("user_token");
        sessionStorage.removeItem("user_user");
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    const hasAccessToken = !!sessionStorage.getItem("user_token");
    const hasRefreshToken = !!(localStorage.getItem("user_refresh_token") || sessionStorage.getItem("user_refresh_token"));
    return !hasAccessToken && hasRefreshToken;
  });

  const login = (newToken: string, newRefreshToken: string, newUser: User, remember: boolean = false) => {
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

    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    sessionStorage.removeItem("user_token");
    sessionStorage.removeItem("user_user");
    sessionStorage.removeItem("user_refresh_token");
    localStorage.removeItem("user_refresh_token");
    localStorage.removeItem("user_remember");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const hasAccessToken = !!sessionStorage.getItem("user_token");
      const refreshToken = localStorage.getItem("user_refresh_token") || sessionStorage.getItem("user_refresh_token");

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
