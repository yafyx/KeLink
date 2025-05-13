"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  userType: "user" | "peddler" | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    type: "user" | "peddler"
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"user" | "peddler" | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const userToken = localStorage.getItem("userToken");
    const peddlerToken = localStorage.getItem("peddlerToken");

    if (userToken) {
      try {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        setUser(userData);
        setUserType("user");
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("userToken");
        localStorage.removeItem("userData");
      }
    } else if (peddlerToken) {
      try {
        const peddlerData = JSON.parse(
          localStorage.getItem("peddlerData") || "{}"
        );
        setUser(peddlerData);
        setUserType("peddler");
      } catch (error) {
        console.error("Error parsing peddler data:", error);
        localStorage.removeItem("peddlerToken");
        localStorage.removeItem("peddlerData");
      }
    }

    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    type: "user" | "peddler"
  ) => {
    setLoading(true);

    try {
      const endpoint =
        type === "user" ? "/api/user/login" : "/api/peddlers/login";

      const response = await fetch(endpoint, {
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

      // Store auth data
      if (type === "user") {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user));
      } else {
        localStorage.setItem("peddlerToken", data.token);
        localStorage.setItem("peddlerData", JSON.stringify(data.peddler));
      }

      setUser(type === "user" ? data.user : data.peddler);
      setUserType(type);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (userType === "user") {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
    } else {
      localStorage.removeItem("peddlerToken");
      localStorage.removeItem("peddlerData");
    }

    setUser(null);
    setUserType(null);
  };

  const isAuthenticated = () => {
    return (
      !!user &&
      ((userType === "user" && !!localStorage.getItem("userToken")) ||
        (userType === "peddler" && !!localStorage.getItem("peddlerToken")))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
