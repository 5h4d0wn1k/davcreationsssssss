import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthState = () => {
  const auth = useAuth();

  const isAdmin = useMemo(() => {
    return auth.user?.userType?.name === 'superadmin' || auth.user?.userType?.name === 'admin';
  }, [auth.user?.userType?.name]);

  const isManager = useMemo(() => {
    return auth.user?.userType?.name === 'manager';
  }, [auth.user?.userType?.name]);

  const isSuperAdmin = useMemo(() => {
    return auth.user?.userType?.name === 'superadmin';
  }, [auth.user?.userType?.name]);

  const hasPermission = useCallback((requiredRole: string) => {
    if (!auth.user?.userType?.name) return false;

    const roleHierarchy = {
      'superadmin': 3,
      'admin': 2,
      'manager': 1,
      'user': 0,
    };

    const userRoleLevel = roleHierarchy[auth.user.userType.name as keyof typeof roleHierarchy] ?? 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 0;

    return userRoleLevel >= requiredRoleLevel;
  }, [auth.user?.userType?.name]);

  const userDisplayName = useMemo(() => {
    if (!auth.user) return '';
    return `${auth.user.firstName} ${auth.user.lastName}`.trim();
  }, [auth.user]);

  const isSessionExpiringSoon = useMemo(() => {
    if (!auth.session?.expiry) return false;
    const expiryTime = auth.session.expiry * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    return timeUntilExpiry > 0 && timeUntilExpiry < 10 * 60 * 1000; // Less than 10 minutes
  }, [auth.session?.expiry]);

  return {
    ...auth,
    isAdmin,
    isManager,
    isSuperAdmin,
    hasPermission,
    userDisplayName,
    isSessionExpiringSoon,
  };
};