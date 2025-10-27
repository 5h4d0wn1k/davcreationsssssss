"use client";

import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useAuth } from "@/contexts/AuthContext";
import { Suspense } from "react";

export default function ActivityLogClient() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
          Activity Log
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitor and track all user activities and system events with comprehensive filtering and audit trails.
        </p>
      </div>

      {/* Activity Feed */}
      <Suspense fallback={
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading activity log...</span>
          </div>
        </div>
      }>
        <ActivityFeedWrapper />
      </Suspense>
    </div>
  );
}

function ActivityFeedWrapper() {
  // This component will be rendered on the client side
  return <ActivityFeedClient />;
}

ActivityFeedWrapper.displayName = 'ActivityFeedWrapper';

function ActivityFeedClient() {
  const { user } = useAuth();
  const userRole = user?.userType?.name || 'user';

  return <ActivityFeed userRole={userRole} initialLimit={50} />;
}

ActivityFeedClient.displayName = 'ActivityFeedClient';