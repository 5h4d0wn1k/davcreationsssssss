"use client";
import React, { useState, useCallback } from "react";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { TimeIcon, UserIcon, BoxIcon, LockIcon, ListIcon } from "@/icons";

interface Activity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'module_assigned' | 'permission_changed' | 'login' | 'logout' | 'password_changed';
  description: string;
  timestamp: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  userRole: string;
  initialLimit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userRole,
  initialLimit = 20
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = initialLimit;

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        userRole,
      });

      if (filters.type) queryParams.append('type', filters.type);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      console.log('ActivityFeed: Fetching activities with URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/activities?${queryParams}`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/activities?${queryParams}`, {
        credentials: 'include',
      });

      console.log('ActivityFeed: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ActivityFeed: Response not ok, status:', response.status, 'error:', errorText);
        throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('ActivityFeed: Received data:', data);
      setActivities(data.activities || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalActivities(data.pagination?.total || 0);
    } catch (err) {
      console.error('ActivityFeed: Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage, userRole]);

  React.useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

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
      case 'password_changed':
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
      case 'password_changed':
        return 'info';
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      userId: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  const activityTypes = [
    { value: '', label: 'All Types' },
    { value: 'user_created', label: 'User Created' },
    { value: 'user_updated', label: 'User Updated' },
    { value: 'user_deleted', label: 'User Deleted' },
    { value: 'module_assigned', label: 'Module Assigned' },
    { value: 'permission_changed', label: 'Permission Changed' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'password_changed', label: 'Password Changed' },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Activity Feed
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <ListIcon className="w-4 h-4" />
            Filters
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalActivities} activities
          </span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading activities...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No activities found</p>
          </div>
        ) : (
          activities.map((activity) => (
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
                  {activity.user && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      by {activity.user.firstName} {activity.user.lastName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalActivities)} of {totalActivities} activities
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};