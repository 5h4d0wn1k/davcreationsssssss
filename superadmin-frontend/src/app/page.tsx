"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import DashboardClient from './(admin)/DashboardClient';
import AppSidebar from '@/layout/AppSidebar';
import AppHeader from '@/layout/AppHeader';
import Backdrop from '@/layout/Backdrop';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isExpanded, isMobile } = useSidebar();
  const router = useRouter();

  console.log('Root page: Auth state - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  useEffect(() => {
    console.log('Root page: useEffect triggered - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('Root page: User authenticated, staying on dashboard');
        // User is already on the dashboard route (/), no redirect needed
        // The dashboard component will render below
      } else {
        console.log('Root page: User not authenticated, redirecting to signin');
        // Redirect to login if not authenticated
        router.push('/signin');
      }
    } else {
      console.log('Root page: Still loading, waiting...');
    }
  }, [isAuthenticated, isLoading, router]);

  // Additional logging to validate state before render
  console.log('Root page: About to render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading SuperAdmin Dashboard...</p>
        </div>
      </div>
    );
  }

  // Show dashboard for authenticated users
  if (isAuthenticated) {
    return (
      <div className="min-h-screen xl:flex">
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ease-in-out ${
          isMobile
            ? 'lg:ml-0'
            : isExpanded
            ? 'lg:ml-[290px]'
            : 'lg:ml-[90px]'
        }`}>
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            <DashboardClient />
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached, but fallback to loading
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}