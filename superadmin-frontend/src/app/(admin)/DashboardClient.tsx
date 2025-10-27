"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RoleBasedContent } from "@/components/dashboard/RoleBasedContent";
import { dashboardService, DashboardMetrics, ActivityItem } from "@/services/api/dashboard";

export default function DashboardClient() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    deletedUsers: 0,
    totalModules: 0,
    activeModules: 0,
    totalUserTypes: 0,
    usersUnderManagement: 0,
    assignedModules: 0,
    personalModules: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [chartData, setChartData] = useState<{
    userRegistrations: number[];
    userActivity: number[];
    categories: string[];
  } | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !user.userType || !user.userType.name) {
      console.log('DashboardClient: User data not complete, skipping fetch', {
        hasUser: !!user,
        hasUserType: !!user?.userType,
        hasUserTypeName: !!user?.userType?.name,
        userId: user?.id,
        userTypeId: user?.userTypeId
      });
      return;
    }

    try {
      console.log('DashboardClient: Starting fetchDashboardData');
      setDashboardLoading(true);
      setError(null);

      const userRole = user.userType.name.toLowerCase();
      console.log('DashboardClient: User role determined as:', userRole);

      // Fetch all dashboard data from the unified dashboard API
      console.log('DashboardClient: Fetching from dashboard API');
      const [dashboardMetrics, dashboardActivities, userStats] = await Promise.all([
        dashboardService.getMetrics(userRole),
        dashboardService.getActivities({ userRole, limit: 10 }),
        dashboardService.getUserStats(userRole),
      ]);

      console.log('DashboardClient: Dashboard API success', { dashboardMetrics, dashboardActivities, userStats });
      setMetrics(dashboardMetrics);
      setActivities(dashboardActivities.activities);
      setChartData(userStats);

    } catch (err: unknown) {
      const error = err as Error;
      console.error('DashboardClient: Error fetching dashboard data:', err);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      console.log('DashboardClient: Finished fetchDashboardData, setting loading to false');
      setDashboardLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('DashboardClient: useEffect triggered', { isAuthenticated, isLoading, user });
    if (isAuthenticated && !isLoading && user && user.userType && user.userType.name) {
      console.log('DashboardClient: User authenticated and data complete, fetching data');
      fetchDashboardData();
    } else {
      console.log('DashboardClient: User not authenticated, still loading, or data incomplete');
      if (!isAuthenticated) {
        console.log('DashboardClient: User is not authenticated');
      }
      if (isLoading) {
        console.log('DashboardClient: Still loading authentication state');
      }
      if (!user || !user.userType || !user.userType.name) {
        console.log('DashboardClient: User data incomplete', {
          hasUser: !!user,
          hasUserType: !!user?.userType,
          hasUserTypeName: !!user?.userType?.name,
          userId: user?.id,
          userTypeId: user?.userTypeId
        });
      }
    }
  }, [isAuthenticated, isLoading, user, fetchDashboardData]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (dashboardLoading) {
        console.warn('DashboardClient: Loading timeout reached, showing error');
        setError('Loading timeout - please refresh the page');
        setDashboardLoading(false);
      }
    }, 30000); // 30 second timeout

    return () => clearTimeout(timeout);
  }, [dashboardLoading]);

  // Additional logging to validate DashboardClient state
  console.log('DashboardClient: About to render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user ? 'present' : 'null', 'userType:', user?.userType ? 'present' : 'null', 'userType.name:', user?.userType?.name || 'null', 'userId:', user?.id, 'userTypeId:', user?.userTypeId);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
            Please sign in to access the dashboard
          </h2>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <RoleBasedContent
      userRole={user?.userType?.name || 'user'}
      userData={user!}
      metrics={metrics}
      activities={activities}
      chartData={chartData}
      isLoading={dashboardLoading || !user?.userType?.name}
      error={error}
    />
  );
}