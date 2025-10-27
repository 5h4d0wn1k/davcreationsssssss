"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = <div>You do not have permission to access this page.</div>
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  console.log('RoleGuard: Checking permissions', { user, isAuthenticated, isLoading, allowedRoles });

  // Show loading state while authentication state is resolving or user data is incomplete
  if (isLoading || !user || !user.userType || !user.userType.name) {
    console.log('RoleGuard: Still loading or user data incomplete', {
      isLoading,
      hasUser: !!user,
      hasUserType: !!user?.userType,
      hasUserTypeName: !!user?.userType?.name,
      userId: user?.id,
      userTypeId: user?.userTypeId
    });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('RoleGuard: User not authenticated');
    return <div>Please log in to access this page.</div>;
  }

  const userRole = user.userType.name.toLowerCase();

  // Special handling for superadmin role - ensure it has access to all admin functions
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
  const hasPermission = normalizedAllowedRoles.includes(userRole) ||
                       (userRole === 'superadmin' && normalizedAllowedRoles.some(role =>
                         ['admin', 'superadmin', 'administrator'].includes(role)
                       ));

  // Additional check: if user is superadmin, they should have access regardless of specific role checks
  const isSuperAdmin = userRole === 'superadmin';
  const finalPermission = hasPermission || isSuperAdmin;

  console.log('RoleGuard: Permission check', { userRole, allowedRoles, hasPermission, isSuperAdmin, finalPermission });

  if (!finalPermission) {
    console.log('RoleGuard: User does not have permission');
    return fallback;
  }

  console.log('RoleGuard: User has permission, rendering children');
  return <>{children}</>;
};

export default RoleGuard;