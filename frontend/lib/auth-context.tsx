"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api-client";
import type { ApiAuthResponse, ApiUserDto, ApiUserRole } from "@/lib/api-types";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  role: "client" | "engineer" | "admin";
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    department: string;
    role: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (
    updates: Partial<Omit<User, "id" | "role">>
  ) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) => Promise<boolean>;
  isLoading: boolean;
}

const TOKEN_STORAGE_KEY = "ticketing.auth.token";
const USER_STORAGE_KEY = "ticketing.auth.user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Map backend role → frontend role
 * Supports both numeric enums (0,1,2) and string enums ("Admin", "Technician", "Client").
 */
const roleFromApi = (role: ApiUserRole): User["role"] => {
  // If backend sends numbers (0,1,2)
  if (typeof role === "number") {
    switch (role) {
      case 2:
        return "admin";
      case 1:
        return "engineer";
      default:
        return "client";
    }
  }

  // If backend sends strings ("Admin", "Technician", "Client")
  switch (role.toString().toLowerCase()) {
    case "admin":
      return "admin";
    case "technician":
      return "engineer";
    default:
      return "client";
  }
};

/**
 * Map frontend role → backend role
 * Here we return the **string** form so TypeScript is happy with ApiUserRole.
 * (Backend can still interpret this if configured for string enums, or ignore it.)
 */
const roleToApi = (role: string): ApiUserRole => {
  switch (role) {
    case "admin":
      return "Admin";
    case "engineer":
      return "Technician";
    default:
      return "Client";
  }
};

const mapUser = (dto: ApiUserDto): User => ({
  id: dto.id,
  name: dto.fullName,
  email: dto.email,
  role: roleFromApi(dto.role),
  phone: dto.phoneNumber ?? null,
  department: dto.department ?? null,
  avatar: dto.avatarUrl ?? null,
});

function persistSession(token: string, user: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("userName", user.name);
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const me = await apiRequest<ApiUserDto>("/api/auth/me", {
        token: authToken,
      });
      const mapped = mapUser(me);
      setUser(mapped);
      persistSession(authToken, mapped);
    } catch {
      clearSession();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    if (storedToken) {
      // Add timeout to prevent hanging if backend is not available
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5 second timeout

      fetchCurrentUser(storedToken)
        .finally(() => {
          clearTimeout(timeoutId);
        });
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<ApiAuthResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      const mapped = mapUser(response.user);
      setUser(mapped);
      setToken(response.token);
      persistSession(response.token, mapped);
      return true;
    } catch (error: any) {
      // Log the actual error for debugging
      console.error("Login error:", error);
      // Check if it's a network error (backend not running)
      if (error?.message?.includes("fetch") || error?.message?.includes("Failed to fetch")) {
        console.error("Backend may not be running. Check if the API server is running on http://localhost:5000");
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    phone: string;
    department: string;
    role: string;
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<ApiAuthResponse>("/api/auth/register", {
        method: "POST",
        body: {
          fullName: userData.name,
          email: userData.email,
          password: userData.password,
          role: roleToApi(userData.role),
          phoneNumber: userData.phone,
          department: userData.department,
        },
      });
      const mapped = mapUser(response.user);
      setUser(mapped);
      setToken(response.token);
      persistSession(response.token, mapped);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearSession();
  };

  const updateProfile = async (updates: Partial<Omit<User, "id" | "role">>) => {
    if (!token) return false;
    try {
      const payload: Record<string, unknown> = {};
      if (updates.name) payload.fullName = updates.name;
      if (updates.email) payload.email = updates.email;
      if (typeof updates.phone !== "undefined")
        payload.phoneNumber = updates.phone;
      if (typeof updates.department !== "undefined")
        payload.department = updates.department;
      if (typeof updates.avatar !== "undefined")
        payload.avatarUrl = updates.avatar;

      const updated = await apiRequest<ApiUserDto>("/api/auth/me", {
        method: "PUT",
        token,
        body: payload,
      });
      const mapped = mapUser(updated);
      setUser(mapped);
      persistSession(token, mapped);
      return true;
    } catch {
      return false;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) => {
    if (!token) return false;
    try {
      const response = await apiRequest<{ success: boolean; message: string }>("/api/auth/change-password", {
        method: "POST",
        token,
        body: { 
          currentPassword, 
          newPassword, 
          confirmNewPassword 
        },
      });
      return response?.success ?? true;
    } catch (error: any) {
      console.error("Change password error:", error);
      // Re-throw to allow form to handle specific error messages
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
