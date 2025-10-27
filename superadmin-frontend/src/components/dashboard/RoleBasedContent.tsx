"use client";
import React from "react";
import { MetricsCards } from "./MetricsCards";
import { UserStats } from "./UserStats";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";
import { IntegratedDashboard } from "./IntegratedDashboard";
import { ActivityItem } from "@/services/api/dashboard";

interface RoleBasedContentProps {
  userRole: string;
  userData: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType?: {
      name: string;
    };
  };
  metrics: {
    totalUsers?: number;
    activeUsers?: number;
    deletedUsers?: number;
    totalModules?: number;
    activeModules?: number;
    totalUserTypes?: number;
    usersUnderManagement?: number;
    assignedModules?: number;
    personalModules?: number;
  };
  activities: ActivityItem[];
  chartData?: {
    userRegistrations?: number[];
    userActivity?: number[];
    categories?: string[];
  } | null;
  isLoading?: boolean;
  error?: string | null;
}

export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  userRole,
  userData,
  metrics,
  activities,
  chartData,
  isLoading = false,
  error = null,
}) => {
  console.log('RoleBasedContent: Rendering with props:', { userRole, userData, metrics, activities, isLoading, error });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderDashboardContent = () => {
    console.log('RoleBasedContent: Rendering dashboard content for role:', userRole.toLowerCase());
    switch (userRole.toLowerCase()) {
      case 'superadmin':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
                Welcome back, {userData.firstName}!
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your entire system from this integrated dashboard.
              </p>
            </div>

            {/* Integrated Management Dashboard */}
            <IntegratedDashboard userRole={userRole} />
          </div>
        );

      case 'admin':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
                Welcome back, {userData.firstName}!
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your users and permissions effectively.
              </p>
            </div>

            {/* Metrics Cards */}
            <MetricsCards userRole={userRole} metrics={metrics} isLoading={isLoading} />

            {/* Charts and Stats */}
            {!isLoading && <UserStats userRole={userRole} chartData={chartData} />}

            {/* Quick Actions */}
            {!isLoading && <QuickActions userRole={userRole} />}

            {/* Recent Activity */}
            {!isLoading && <RecentActivity activities={activities} userRole={userRole} />}
          </div>
        );

      case 'manager':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
                Welcome back, {userData.firstName}!
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Monitor and manage your team members.
              </p>
            </div>

            {/* Metrics Cards */}
            <MetricsCards userRole={userRole} metrics={metrics} isLoading={isLoading} />

            {/* Charts and Stats */}
            {!isLoading && <UserStats userRole={userRole} chartData={chartData} />}

            {/* Quick Actions */}
            {!isLoading && <QuickActions userRole={userRole} />}

            {/* Recent Activity */}
            {!isLoading && <RecentActivity activities={activities} userRole={userRole} />}
          </div>
        );

      case 'user':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
                Welcome back, {userData.firstName}!
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Here&apos;s your personal dashboard overview.
              </p>
            </div>

            {/* Metrics Cards */}
            <MetricsCards userRole={userRole} metrics={metrics} isLoading={isLoading} />

            {/* Charts and Stats */}
            {!isLoading && <UserStats userRole={userRole} chartData={chartData} />}

            {/* Quick Actions */}
            {!isLoading && <QuickActions userRole={userRole} />}

            {/* Recent Activity */}
            {!isLoading && <RecentActivity activities={activities} userRole={userRole} />}
          </div>
        );

      default:
        console.log('RoleBasedContent: Unknown role, showing access denied');
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You don&apos;t have permission to view this dashboard.
              </p>
            </div>
          </div>
        );
    }
  };

  return renderDashboardContent();
};