"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  authApi,
  handleApiError,
  shouldLogoutOnError,
  getErrorType,
  ApiError,
  UserDetails,
} from "../lib/api";

// Role hierarchy (superadmin > admin > manager > user)
export type UserRole = "superadmin" | "admin" | "manager" | "user";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 4,
  admin: 3,
  manager: 2,
  user: 1,
};

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserDetails | null;
  userRole: UserRole | null;
  login: (email: string, password: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  sessionExpired: boolean;
  // Role-based permission helpers (mitigates backend isAdminOrManager bug)
  hasRole: (role: UserRole) => boolean;
  hasMinimumRole: (minRole: UserRole) => boolean;
  canManageUsers: () => boolean;
  canManageModules: () => boolean;
  canManageUserTypes: () => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tokenRefreshInProgress, setTokenRefreshInProgress] = useState(false);

  // Extract and normalize user role from user data
  const extractUserRole = (userData: UserDetails | null): UserRole | null => {
    if (!userData || !userData.userType) return null;
    const roleStr = userData.userType.toLowerCase() as UserRole;
    // Validate it's a known role
    if (roleStr in ROLE_HIERARCHY) {
      return roleStr;
    }
    console.warn(
      `Unknown user role: ${userData.userType}, defaulting to 'user'`
    );
    return "user";
  };

  const checkSession = async () => {
    try {
      console.log("AuthProvider: Checking session validity");
      const userData = await authApi.getUserDetails();
      console.log("AuthProvider: Session valid, user data:", userData);
      const role = extractUserRole(userData);
      setUser(userData);
      setUserRole(role);
      setIsAuthenticated(true);
      setSessionExpired(false);
    } catch (error: any) {
      console.log("AuthProvider: Session invalid or expired:", error);

      // Check if this is an auth error that should trigger logout
      if (shouldLogoutOnError(error)) {
        console.log("AuthProvider: Auth error detected, logging out");
        setSessionExpired(true);
        await performLogout();
      } else {
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    if (tokenRefreshInProgress) {
      console.log("AuthProvider: Token refresh already in progress");
      return false;
    }

    try {
      setTokenRefreshInProgress(true);
      console.log("AuthProvider: Attempting token refresh");

      // Try to get user details to refresh session
      const userData = await authApi.getUserDetails();
      console.log("AuthProvider: Token refresh successful");

      const role = extractUserRole(userData);
      setUser(userData);
      setUserRole(role);
      setIsAuthenticated(true);
      setSessionExpired(false);
      return true;
    } catch (error: any) {
      console.log("AuthProvider: Token refresh failed:", error);

      if (shouldLogoutOnError(error)) {
        setSessionExpired(true);
        await performLogout();
      }
      return false;
    } finally {
      setTokenRefreshInProgress(false);
    }
  };

  const performLogout = async () => {
    try {
      console.log("AuthProvider: Performing logout");
      await authApi.logout();
    } catch (error) {
      console.error("AuthProvider: Logout API call failed:", error);
    } finally {
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
      setSessionExpired(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string, otp: string) => {
    try {
      console.log("AuthProvider: Attempting login for:", email);

      // Call login API which creates the session
      await authApi.login({ email, user_password: password, otp });
      console.log("AuthProvider: Login successful");

      // After successful login, fetch user details
      try {
        const userData = await authApi.getUserDetails();
        const role = extractUserRole(userData);
        setUser(userData);
        setUserRole(role);
        setIsAuthenticated(true);
        setSessionExpired(false);
      } catch (userError: any) {
        console.error(
          "AuthProvider: Failed to fetch user details after login:",
          userError
        );
        // Login was successful but user data fetch failed
        // Still set as authenticated since session was created
        setIsAuthenticated(true);
        setSessionExpired(false);
        setUser(null);
        setUserRole(null);
      }
    } catch (error: any) {
      console.error("AuthProvider: Login failed:", error);

      // Ensure we're not authenticated on login failure
      setIsAuthenticated(false);
      setUser(null);

      // Handle different error types and rethrow with proper error
      const errorType = getErrorType(error);

      if (errorType === "rate-limit") {
        const apiError = error as ApiError;
        const retryAfter = apiError.details?.retryAfter
          ? Math.ceil(apiError.details.retryAfter / 1000)
          : 60;
        throw {
          ...error,
          message: `Too many login attempts. Please wait ${retryAfter} seconds before trying again.`,
        };
      }

      if (errorType === "auth") {
        throw {
          ...error,
          message:
            "Invalid credentials or verification code. Please try again.",
        };
      }

      if (errorType === "network") {
        throw {
          ...error,
          message: "Network error. Please check your connection and try again.",
        };
      }

      // Re-throw with proper error handling
      throw error;
    }
  };

  const logout = async () => {
    await performLogout();
  };

  // Set up periodic session validation and token refresh attempts
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      console.log("AuthProvider: Periodic session check");
      try {
        await checkSession();
      } catch (error) {
        console.log(
          "AuthProvider: Periodic session check failed, attempting refresh"
        );
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.log(
            "AuthProvider: Token refresh failed, user needs to re-authenticate"
          );
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Role-based permission helpers
  // ⚠️ CRITICAL: These are needed because backend's isAdminOrManager middleware is buggy
  // Frontend MUST implement its own role-based UI gating

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const hasMinimumRole = (minRole: UserRole): boolean => {
    if (!userRole) return false;
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
  };

  const canManageUsers = (): boolean => {
    // Requires admin or higher (superadmin > admin)
    return hasMinimumRole("admin");
  };

  const canManageModules = (): boolean => {
    // Requires admin or higher
    return hasMinimumRole("admin");
  };

  const canManageUserTypes = (): boolean => {
    // Requires superadmin (owner) only
    return hasRole("superadmin");
  };

  const isOwner = (): boolean => {
    return hasRole("superadmin");
  };

  const isAdmin = (): boolean => {
    return hasRole("admin") || hasRole("superadmin");
  };

  const isManager = (): boolean => {
    return hasRole("manager");
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    userRole,
    login,
    logout,
    checkSession,
    refreshToken,
    sessionExpired,
    hasRole,
    hasMinimumRole,
    canManageUsers,
    canManageModules,
    canManageUserTypes,
    isOwner,
    isAdmin,
    isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
