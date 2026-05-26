import React, { useState } from "react";
import { AuthContext } from "./AuthContext";
import type { User } from "./AuthContext";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("admin_token");
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("admin_user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
      }
    }
    return null;
  });

  const [loading] = useState(false);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("admin_token", newToken);
    localStorage.setItem("admin_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
