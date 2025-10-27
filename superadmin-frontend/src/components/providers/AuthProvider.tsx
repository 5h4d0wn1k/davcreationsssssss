"use client";

import React, { ReactNode, useEffect, useState } from 'react';
import { AuthProvider as AuthContextProvider } from '../../contexts/AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);

  // Ensure AuthProvider is fully mounted before rendering children
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent rendering children until AuthProvider is fully mounted
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <AuthContextProvider>{children}</AuthContextProvider>;
};