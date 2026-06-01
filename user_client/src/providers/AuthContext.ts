import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  role: string;
  display_name?: string | null;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: User, remember?: boolean) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
