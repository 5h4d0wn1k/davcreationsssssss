"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { TimeIcon, UserIcon, BoxIcon, LockIcon } from "@/icons";

interface Activity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'module_assigned' | 'permission_changed' | 'login' | 'logout';
  description: string;
  timestamp: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: Record<string, unknown>;
}

interface RecentActivityProps {
  activities: Activity[];
  userRole: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, userRole }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created':
      case 'user_updated':
      case 'user_deleted':
        return <UserIcon className="w-4 h-4 text-blue-500" />;
      case 'module_assigned':
        return <BoxIcon className="w-4 h-4 text-green-500" />;
      case 'permission_changed':
        return <LockIcon className="w-4 h-4 text-purple-500" />;
      case 'login':
      case 'logout':
        return <TimeIcon className="w-4 h-4 text-gray-500" />;
      default:
        return <TimeIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'user_created':
        return 'success';
      case 'user_updated':
        return 'warning';
      case 'user_deleted':
        return 'error';
      case 'module_assigned':
        return 'success';
      case 'permission_changed':
        return 'info';
      case 'login':
        return 'success';
      case 'logout':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const filteredActivities = activities.filter(activity => {
    // Filter activities based on user role permissions
    switch (userRole.toLowerCase()) {
      case 'superadmin':
        return true; // See all activities
      case 'admin':
        return ['user_created', 'user_updated', 'module_assigned', 'permission_changed'].includes(activity.type);
      case 'manager':
        return ['user_created', 'user_updated', 'login', 'logout'].includes(activity.type);
      case 'user':
        return activity.type === 'login' || activity.type === 'logout';
      default:
        return false;
    }
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Activity
        </h3>
        <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
          </div>
        ) : (
          filteredActivities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-white/90">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge size="sm" color={getActivityBadgeColor(activity.type)}>
                    {activity.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};