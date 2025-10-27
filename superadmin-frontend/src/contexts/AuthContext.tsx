"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { User, Session, LoginCredentials, RegisterData, GoogleLoginData, ForgotPasswordData, SendOtpData, VerifyOtpData } from '../services/types/auth';
import { authService } from '../services/api/auth';
import { logger } from '../services/utils/logger';
import apiClient from '../services/api/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  lastError: Error | null;
  lastActivity: number;
  sessionWarnings: string[];
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  googleLogin: (data: GoogleLoginData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  sendOtp: (data: SendOtpData) => Promise<void>;
  verifyOtp: (data: VerifyOtpData) => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateActivity: () => void;
  clearSessionWarnings: () => void;
  clearError: () => void;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SESSION'; payload: Session | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_ERROR'; payload: Error | null }
  | { type: 'UPDATE_ACTIVITY'; payload: number }
  | { type: 'ADD_SESSION_WARNING'; payload: string }
  | { type: 'CLEAR_SESSION_WARNINGS' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  lastError: null,
  lastActivity: Date.now(),
  sessionWarnings: [],
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: null,
        lastError: null,
        sessionWarnings: [], // Clear warnings on successful auth
      };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_LAST_ERROR':
      return { ...state, lastError: action.payload };
    case 'UPDATE_ACTIVITY':
      return { ...state, lastActivity: action.payload };
    case 'ADD_SESSION_WARNING':
      return {
        ...state,
        sessionWarnings: [...state.sessionWarnings, action.payload].slice(-5), // Keep last 5 warnings
      };
    case 'CLEAR_SESSION_WARNINGS':
      return { ...state, sessionWarnings: [] };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      // Clear JWT tokens
      apiClient.clearAllTokens();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();

      // Validate user data structure
      if (!user || typeof user !== 'object') {
        throw new Error('Invalid user data received during refresh');
      }

      // Ensure user has required fields
      if (!user.id || !user.firstName || !user.lastName) {
        throw new Error('User data is incomplete during refresh');
      }

      // Validate userType if present
      if (user.userType && (!user.userType.name || !user.userType.id)) {
        console.warn('AuthContext: User has incomplete userType data during refresh');
      }

      dispatch({ type: 'SET_USER', payload: user });
      // Note: May need to get updated session info
    } catch (error) {
      console.error('AuthContext: Failed to refresh session:', error);
      const errorMessage = 'Session refresh failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LAST_ERROR', payload: error instanceof Error ? error : new Error(errorMessage) });
      logout();
    }
  }, [logout]);

  const refreshToken = useCallback(async () => {
    try {
      logger.debug('AuthContext: Refreshing JWT token');
      const response = await authService.refreshToken();

      if (response.accessToken) {
        // Update tokens in API client
        apiClient.setTokens(response.accessToken, response.refreshToken);

        // Optionally refresh user data
        await refreshSession();
      }
    } catch (error) {
      logger.error('AuthContext: Token refresh failed');
      const errorMessage = 'Token refresh failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LAST_ERROR', payload: error instanceof Error ? error : new Error(errorMessage) });
      logout();
    }
  }, [refreshSession, logout]);

  const validateSession = useCallback(async () => {
    try {
      await refreshToken();
    } catch (error) {
      console.warn('Session validation failed:', error);
      logout();
    }
  }, [refreshToken, logout]);


  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      logger.debug('AuthContext: Checking auth status on mount');
      try {
        const user = await authService.getCurrentUser();
        logger.debug('AuthContext: User found');

        // Validate user data structure
        if (!user || typeof user !== 'object') {
          throw new Error('Invalid user data received');
        }

        // Ensure user has required fields
        if (!user.id || !user.firstName || !user.lastName) {
          throw new Error('User data is incomplete');
        }

        // Validate userType if present
        if (user.userType && (!user.userType.name || !user.userType.id)) {
          logger.warn('AuthContext: User has incomplete userType data');
        }

        dispatch({ type: 'SET_USER', payload: user });
        // Note: Session info might need to be stored separately or retrieved
      } catch {
        logger.debug('AuthContext: No authenticated user found or invalid user data');
        // User not authenticated or invalid data
        dispatch({ type: 'SET_USER', payload: null });
      } finally {
        logger.debug('AuthContext: Setting loading to false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Debug logging for auth state changes
  useEffect(() => {
    logger.debug('AuthContext: Auth state changed - isLoading:', state.isLoading, 'isAuthenticated:', state.isAuthenticated, 'user:', state.user ? 'present' : 'null');
    if (state.user) {
      logger.debug('AuthContext: User details - id:', state.user.id, 'role:', state.user.userType?.name, 'firstName:', state.user.firstName);
    }
  }, [state.isLoading, state.isAuthenticated, state.user]);

  // Auto refresh session before expiry
  useEffect(() => {
    if (state.session?.expiry) {
      const expiryTime = state.session.expiry * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // Refresh 5 minutes before expiry
      const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

      if (refreshTime > 0) {
        const timer = setTimeout(() => {
          refreshToken().catch(() => {
            // Fallback to session refresh if token refresh fails
            refreshSession();
          });
        }, refreshTime);

        return () => clearTimeout(timer);
      } else if (timeUntilExpiry <= 0) {
        // Session already expired
        logout();
      }
    }
  }, [state.session, logout, refreshSession, refreshToken]);


  // Listen for auth logout events from API client
  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleAuthLogout);
      return () => window.removeEventListener('auth:logout', handleAuthLogout);
    }
  }, [logout]);

  // Session validation logic (moved from hook to prevent premature useAuth calls)
  useEffect(() => {
    if (!state.isAuthenticated || state.isLoading) return;

    const intervalRef = { current: null as NodeJS.Timeout | null };
    const lastActivityRef = { current: Date.now() };

    // Update last activity timestamp
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      dispatch({ type: 'UPDATE_ACTIVITY', payload: Date.now() });
    };

    // Check if session should be validated
    const shouldValidateSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      const sessionTimeout = 30 * 60 * 1000; // 30 minutes of inactivity

      return timeSinceLastActivity > sessionTimeout;
    };


    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => updateActivity();

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up periodic session validation (every 5 minutes)
    intervalRef.current = setInterval(() => {
      if (shouldValidateSession()) {
        validateSession();
      }
    }, 5 * 60 * 1000);

    // Initial activity update
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isAuthenticated, state.isLoading, validateSession]);

  const login = async (credentials: LoginCredentials) => {
    logger.debug('AuthContext: Starting login process');
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      logger.debug('AuthContext: Calling authService.login');
      const response = await authService.login(credentials);
      logger.debug('AuthContext: Login response received');

      // Validate login response data
      if (!response || !response.user) {
        throw new Error('Invalid login response: missing user data');
      }

      // Validate user data structure
      if (typeof response.user !== 'object' || !response.user.id || !response.user.firstName || !response.user.lastName) {
        throw new Error('Invalid user data in login response');
      }

      // Validate userType if present
      if (response.user.userType && (!response.user.userType.name || !response.user.userType.id)) {
        logger.warn('AuthContext: User has incomplete userType data after login');
      }

      dispatch({ type: 'SET_USER', payload: response.user });
      dispatch({ type: 'SET_SESSION', payload: response.session });

      // Store JWT tokens if provided in response
      // Note: AuthResponse interface may not include accessToken, so this is commented out
      // if (response.accessToken) {
      //   apiClient.setTokens(response.accessToken, response.refreshToken);
      // }

      logger.debug('AuthContext: Dispatched SET_USER and SET_SESSION');
    } catch (error: unknown) {
      logger.debug('AuthContext: Login error');
      const err = error as { message?: string };
      const errorMessage = err.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LAST_ERROR', payload: error instanceof Error ? error : new Error(errorMessage) });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      logger.debug('AuthContext: Login process completed, loading set to false');
    }
  };

  const register = async (data: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.register(data);

      // Validate registration response data
      if (!response || !response.user) {
        throw new Error('Invalid registration response: missing user data');
      }

      // Validate user data structure
      if (typeof response.user !== 'object' || !response.user.id || !response.user.firstName || !response.user.lastName) {
        throw new Error('Invalid user data in registration response');
      }

      // Validate userType if present
      if (response.user.userType && (!response.user.userType.name || !response.user.userType.id)) {
        console.warn('AuthContext: User has incomplete userType data after registration');
      }

      dispatch({ type: 'SET_USER', payload: response.user });
      dispatch({ type: 'SET_SESSION', payload: response.session });
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = err.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LAST_ERROR', payload: error instanceof Error ? error : new Error(errorMessage) });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch {
      // Continue with logout even if API call fails
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const googleLogin = async (data: GoogleLoginData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await authService.googleLogin(data);

      // Validate Google login response data
      if (!response || !response.user) {
        throw new Error('Invalid Google login response: missing user data');
      }

      // Validate user data structure
      if (typeof response.user !== 'object' || !response.user.id || !response.user.firstName || !response.user.lastName) {
        throw new Error('Invalid user data in Google login response');
      }

      // Validate userType if present
      if (response.user.userType && (!response.user.userType.name || !response.user.userType.id)) {
        console.warn('AuthContext: User has incomplete userType data after Google login');
      }

      dispatch({ type: 'SET_USER', payload: response.user });
      dispatch({ type: 'SET_SESSION', payload: response.session });
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = err.message || 'Google login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LAST_ERROR', payload: error instanceof Error ? error : new Error(errorMessage) });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authService.forgotPassword(data);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = err.message || 'Forgot password failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LAST_ERROR', payload: error instanceof Error ? error : new Error(errorMessage) });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendOtp = async (data: SendOtpData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authService.sendOtp(data);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = err.message || 'Send OTP failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LAST_ERROR', payload: error instanceof Error ? error : new Error(errorMessage) });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyOtp = async (data: VerifyOtpData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authService.verifyOtp(data);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = err.message || 'Verify OTP failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LAST_ERROR', payload: error instanceof Error ? error : new Error(errorMessage) });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };


  const updateActivity = () => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: Date.now() });
  };

  const clearSessionWarnings = () => {
    dispatch({ type: 'CLEAR_SESSION_WARNINGS' });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_LAST_ERROR', payload: null });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    logoutAll,
    googleLogin,
    forgotPassword,
    sendOtp,
    verifyOtp,
    refreshSession,
    refreshToken,
    updateActivity,
    clearSessionWarnings,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};