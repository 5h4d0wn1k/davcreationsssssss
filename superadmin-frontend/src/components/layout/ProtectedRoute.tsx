"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = '/signin'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  console.log('ProtectedRoute: Auth state:', { isAuthenticated, isLoading, user });

  useEffect(() => {
    console.log('ProtectedRoute: useEffect triggered', { isAuthenticated, isLoading, user });
    if (!isLoading && !isAuthenticated) {
      console.log('ProtectedRoute: Redirecting to:', redirectTo);
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('ProtectedRoute: Showing loading state while auth resolves');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, not rendering children');
    return null;
  }

  // Additional validation: ensure user data is complete before rendering
  if (!user || !user.id || !user.firstName || !user.lastName) {
    console.log('ProtectedRoute: User data incomplete, showing loading');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  console.log('ProtectedRoute: Auth resolved and user data valid, rendering children');
  // Render children if authenticated and user data is valid
  return <>{children}</>;
}