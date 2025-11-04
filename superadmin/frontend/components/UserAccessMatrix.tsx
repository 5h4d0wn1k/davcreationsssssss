'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { accessOverviewApi, handleApiError } from '../lib/api';
import { LoadingSpinner, LoadingButton } from './LoadingSpinner';
import { Alert } from './FormError';

interface UserAccessData {
  user: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    user_type_name: string;
    user_type_value: number;
    is_active: boolean;
  };
  assignedModules: number[];
  totalAssigned: number;
}

interface ModuleData {
  module_id: number;
  module_name: string;
  short_description: string;
  is_active: boolean;
}

interface UserAccessMatrixProps {
  onUserSelect?: (userId: number) => void;
}

export default function UserAccessMatrix({ onUserSelect }: UserAccessMatrixProps) {
  const [data, setData] = useState<{
    users: UserAccessData[];
    modules: ModuleData[];
    totalUsers: number;
    totalModules: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'modules'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await accessOverviewApi.getUserAccessMatrix();
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

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    if (!data) return [];

    let filtered = data.users.filter(user => {
      const matchesSearch = searchTerm === '' ||
        `${user.user.first_name} ${user.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedUserType === 'all' || user.user.user_type_name === selectedUserType;

      return matchesSearch && matchesType && user.user.is_active;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = `${a.user.first_name} ${a.user.last_name}`.toLowerCase();
          bValue = `${b.user.first_name} ${b.user.last_name}`.toLowerCase();
          break;
        case 'type':
          aValue = a.user.user_type_name;
          bValue = b.user.user_type_name;
          break;
        case 'modules':
          aValue = a.totalAssigned;
          bValue = b.totalAssigned;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [data, searchTerm, selectedUserType, sortBy, sortOrder]);

  // Get unique user types for filter
  const userTypes = useMemo(() => {
    if (!data) return [];
    const types = [...new Set(data.users.map(u => u.user.user_type_name))];
    return types.sort();
  }, [data]);

  // Check if module is assigned to user
  const isModuleAssigned = (user: UserAccessData, moduleId: number) => {
    return user.assignedModules.includes(moduleId);
  };

  // Handle sort
  const handleSort = (column: 'name' | 'type' | 'modules') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
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
          <h2 className="text-xl font-semibold text-foreground">User Access Matrix</h2>
          <p className="text-muted text-sm">Comprehensive view of user-module access assignments</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted">
            {filteredUsers.length} of {data.totalUsers} users • {data.totalModules} modules
          </div>
          <LoadingButton onClick={loadData} loading={loading} className="text-sm">
            Refresh
          </LoadingButton>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 glass rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedUserType}
            onChange={(e) => setSelectedUserType(e.target.value)}
            className="w-full px-3 py-2 glass rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="all">All User Types</option>
            {userTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <span>User</span>
                    {sortBy === 'name' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <span>Type</span>
                    {sortBy === 'type' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort('modules')}
                    className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <span>Modules</span>
                    {sortBy === 'modules' && (
                      <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </button>
                </th>
                {data.modules.slice(0, 10).map(module => (
                  <th key={module.module_id} className="px-2 py-3 text-center min-w-[60px]">
                    <div className="text-xs font-medium text-foreground transform -rotate-45 origin-center whitespace-nowrap">
                      {module.module_name.length > 8 ? `${module.module_name.substring(0, 8)}...` : module.module_name}
                    </div>
                  </th>
                ))}
                {data.modules.length > 10 && (
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted">
                    +{data.modules.length - 10} more
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userData) => (
                <tr
                  key={userData.user.user_id}
                  className="border-t border-border/50 hover:bg-background/30 transition-colors cursor-pointer"
                  onClick={() => onUserSelect?.(userData.user.user_id)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-foreground">
                        {userData.user.first_name} {userData.user.last_name}
                      </div>
                      <div className="text-sm text-muted">{userData.user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      userData.user.user_type_name === 'superadmin'
                        ? 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-200'
                        : userData.user.user_type_name === 'admin'
                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                        : userData.user.user_type_name === 'manager'
                        ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {userData.user.user_type_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
                      {userData.totalAssigned}
                    </span>
                  </td>
                  {data.modules.slice(0, 10).map(module => (
                    <td key={module.module_id} className="px-2 py-3 text-center">
                      {isModuleAssigned(userData, module.module_id) ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-300 rounded-full mx-auto"></div>
                      )}
                    </td>
                  ))}
                  {data.modules.length > 10 && (
                    <td className="px-4 py-3 text-center text-sm text-muted">
                      {userData.assignedModules.filter(id => !data.modules.slice(0, 10).some(m => m.module_id === id)).length > 0 && (
                        <span>+{userData.assignedModules.filter(id => !data.modules.slice(0, 10).some(m => m.module_id === id)).length}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
            <p className="text-muted">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-muted">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Assigned</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span>Not Assigned</span>
        </div>
      </div>
    </div>
  );
}