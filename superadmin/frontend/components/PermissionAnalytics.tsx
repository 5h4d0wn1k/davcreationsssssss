'use client';

import React, { useState, useEffect } from 'react';
import { accessOverviewApi, handleApiError } from '../lib/api';
import { LoadingSpinner, LoadingButton } from './LoadingSpinner';
import { Alert } from './FormError';

interface UserTypeStats {
  user_type: string;
  userCount: number;
  activeUsers: number;
  averageModulesPerUser: number;
}

interface ModuleStats {
  module_id: number;
  module_name: string;
  assignedUsers: number;
  assignmentRate: number;
}

interface OverallStats {
  totalUsers: number;
  totalModules: number;
  totalAssignments: number;
  averageModulesPerUser: number;
}

export default function PermissionAnalytics() {
  const [data, setData] = useState<{
    userTypeStats: UserTypeStats[];
    moduleStats: ModuleStats[];
    overallStats: OverallStats;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await accessOverviewApi.getPermissionAnalytics();
      setData(result);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get user type color
  const getUserTypeColor = (userType: string) => {
    switch (userType.toLowerCase()) {
      case 'superadmin':
        return 'bg-red-500';
      case 'admin':
        return 'bg-blue-500';
      case 'manager':
        return 'bg-green-500';
      case 'user':
        return 'bg-gray-500';
      default:
        return 'bg-purple-500';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Alert type="error" message={error} onDismiss={() => setError('')} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Permission Analytics</h2>
          <p className="text-muted text-sm">Statistics and insights about permission distribution</p>
        </div>
        <LoadingButton onClick={loadData} loading={loading} className="text-sm">
          Refresh
        </LoadingButton>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.overallStats.totalUsers}</p>
              <p className="text-muted text-sm">Total Users</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.overallStats.totalModules}</p>
              <p className="text-muted text-sm">Total Modules</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.overallStats.totalAssignments}</p>
              <p className="text-muted text-sm">Total Assignments</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{data.overallStats.averageModulesPerUser.toFixed(1)}</p>
              <p className="text-muted text-sm">Avg Modules/User</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">User Type Distribution</h3>
          <div className="space-y-4">
            {data.userTypeStats.map((stat) => (
              <div key={stat.user_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground capitalize">{stat.user_type}</span>
                  <span className="text-sm text-muted">
                    {stat.activeUsers}/{stat.userCount} active
                  </span>
                </div>
                <div className="w-full bg-background/50 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUserTypeColor(stat.user_type)}`}
                    style={{ width: `${(stat.userCount / data.overallStats.totalUsers) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>{stat.userCount} users</span>
                  <span>Avg {stat.averageModulesPerUser.toFixed(1)} modules</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module Usage Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Module Usage</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data.moduleStats
              .sort((a, b) => b.assignedUsers - a.assignedUsers)
              .slice(0, 10)
              .map((module) => (
              <div key={module.module_id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate" title={module.module_name}>
                    {module.module_name}
                  </span>
                  <span className="text-xs text-muted">
                    {module.assignedUsers} users ({module.assignmentRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-background/50 rounded-full h-1.5">
                  <div
                    className="h-1.5 bg-primary rounded-full"
                    style={{ width: `${module.assignmentRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Module Statistics */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Module Assignment Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Module</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Users Assigned</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Assignment Rate</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.moduleStats
                .sort((a, b) => b.assignedUsers - a.assignedUsers)
                .map((module) => (
                <tr key={module.module_id} className="border-b border-border/20">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-foreground">{module.module_name}</div>
                      <div className="text-sm text-muted">ID: {module.module_id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-sm">
                      {module.assignedUsers}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-16 bg-background/50 rounded-full h-2">
                        <div
                          className="h-2 bg-primary rounded-full"
                          style={{ width: `${module.assignmentRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted">{module.assignmentRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      module.assignmentRate > 75
                        ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-200'
                        : module.assignmentRate > 50
                        ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {module.assignmentRate > 75 ? 'High' : module.assignmentRate > 50 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}