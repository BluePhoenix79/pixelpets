import React, { useEffect, useState } from "react";
import { AuthContext, type User } from "./AuthContextProvider";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    // Check if guest mode was active
    const guestActive = localStorage.getItem("pixelpets_guest_active");
    if (guestActive === "true") {
      setIsGuest(true);
      setUser({
        id: "guest_user",
        email: "guest@pixelpets.com",
        username: "Guest",
      });
      setHasProfile(true);
      setLoading(false);
      return;
    }

    // Check for JWT token
    const token = localStorage.getItem("pixelpets_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token invalid");
      }

      const userData = await response.json();
      setUser({
        id: userData.id,
        email: userData.email,
        username: userData.username,
      });
      setHasProfile(userData.hasProfile);
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("pixelpets_token");
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user && !isGuest) {
      const token = localStorage.getItem("pixelpets_token");
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const userData = await response.json();
          setHasProfile(userData.hasProfile);
          setUser({
            id: userData.id,
            email: userData.email,
            username: userData.username,
          });
        } catch (error) {
          console.error("Refresh profile failed:", error);
        }
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token
      localStorage.setItem("pixelpets_token", data.token);

      setUser(data.user);
      setHasProfile(!!data.user.username);

      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // Store token
      localStorage.setItem("pixelpets_token", data.token);

      setUser(data.user);
      setHasProfile(true);

      return { error: null };
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };

  const signOut = async () => {
    if (isGuest) {
      setIsGuest(false);
      setUser(null);
      setHasProfile(false);
      localStorage.removeItem("pixelpets_guest_active");
    } else {
      localStorage.removeItem("pixelpets_token");
      setUser(null);
      setHasProfile(false);
    }
  };

  const loginAsGuest = () => {
    localStorage.setItem("pixelpets_guest_active", "true");
    setIsGuest(true);
    setUser({
      id: "guest_user",
      email: "guest@pixelpets.com",
      username: "Guest",
    });
    setHasProfile(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        hasProfile,
        signIn,
        signUp,
        signOut,
        loginAsGuest,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
