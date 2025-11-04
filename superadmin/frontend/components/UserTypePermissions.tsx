'use client';

import React, { useState, useEffect } from 'react';
import { accessOverviewApi, handleApiError } from '../lib/api';
import { LoadingSpinner, LoadingButton } from './LoadingSpinner';
import { Alert } from './FormError';

interface UserTypePermission {
  user_type_id: number;
  user_type_name: string;
  user_type_value: number;
  defaultModules: number[];
  totalDefaultModules: number;
}

interface ModuleData {
  module_id: number;
  module_name: string;
  short_description: string;
  is_active: boolean;
}

export default function UserTypePermissions() {
  const [data, setData] = useState<{
    userTypes: UserTypePermission[];
    allModules: ModuleData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await accessOverviewApi.getUserTypePermissions();
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
  const getUserTypeColor = (userTypeName: string) => {
    switch (userTypeName.toLowerCase()) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'user':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
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
          <h2 className="text-xl font-semibold text-foreground">User Type Permissions</h2>
          <p className="text-muted text-sm">Default permissions assigned to each user type</p>
        </div>
        <LoadingButton onClick={loadData} loading={loading} className="text-sm">
          Refresh
        </LoadingButton>
      </div>

      {/* User Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.userTypes.map((userType) => (
          <div key={userType.user_type_id} className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground capitalize">
                {userType.user_type_name}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getUserTypeColor(userType.user_type_name)}`}>
                Level {userType.user_type_value}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Default Modules</span>
                <span className="text-lg font-bold text-primary">{userType.totalDefaultModules}</span>
              </div>

              {/* Module List */}
              <div className="space-y-2">
                {userType.user_type_name === 'superadmin' ? (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-red-900 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted font-bold">All modules by default</p>
                  </div>
                ) : userType.defaultModules.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {userType.defaultModules.slice(0, 5).map(moduleId => {
                      const module = data.allModules.find(m => m.module_id === moduleId);
                      return module ? (
                        <div key={moduleId} className="flex items-center space-x-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-muted truncate">{module.module_name}</span>
                        </div>
                      ) : null;
                    })}
                    {userType.defaultModules.length > 5 && (
                      <div className="text-xs text-muted text-center pt-1">
                        +{userType.defaultModules.length - 5} more modules
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted">No default permissions</p>
                  </div>
                )}
              </div>

              {/* Permission Inheritance Info */}
              <div className="pt-3 border-t border-border/50">
                <div className="text-xs text-muted">
                  <div className="flex items-center space-x-1 mb-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Individual assignments override defaults</span>
                  </div>
                  {userType.user_type_name === 'superadmin' && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span className="font-bold">Full system access</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Hierarchy Explanation */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Permission Hierarchy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-foreground mb-3">Inheritance Rules</h4>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <strong className="text-foreground">Super Admin:</strong> Access to all modules by default
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <strong className="text-foreground">Admin:</strong> Can manage users and modules within their scope
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <strong className="text-foreground">Manager:</strong> Limited administrative access
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                <div>
                  <strong className="text-foreground">User:</strong> Basic access only
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-3">Permission Types</h4>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span><strong className="text-foreground">Inherited:</strong> From user type defaults</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span><strong className="text-foreground">Explicit:</strong> Individually assigned</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span><strong className="text-foreground">Override:</strong> Explicit permissions take precedence</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}