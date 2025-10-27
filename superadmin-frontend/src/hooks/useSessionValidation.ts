import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useSessionValidation = () => {
  const { isAuthenticated, refreshToken, logout, updateActivity: updateAuthActivity } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    updateAuthActivity(); // Update auth context activity
  }, [updateAuthActivity]);

  // Check if session should be validated
  const shouldValidateSession = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes of inactivity

    return timeSinceLastActivity > sessionTimeout;
  };

  // Validate session with server
  const validateSession = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Attempt to refresh token to validate session
      await refreshToken();
    } catch (error) {
      console.warn('Session validation failed:', error);
      // If refresh fails, logout user
      logout();
    }
  }, [isAuthenticated, refreshToken, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

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
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, updateActivity, validateSession]);

  return {
    updateActivity,
    validateSession,
  };
};