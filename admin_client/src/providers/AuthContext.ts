import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
