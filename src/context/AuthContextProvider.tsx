import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  username?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  hasProfile: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    username?: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginAsGuest: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
