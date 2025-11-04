'use client';

import React, { useState, useEffect } from 'react';
import { accessOverviewApi, userApi, moduleApi, handleApiError } from '../lib/api';
import { LoadingSpinner, LoadingButton } from './LoadingSpinner';
import { Alert, FormError } from './FormError';

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type_id: number;
  is_active: boolean;
}

interface Module {
  module_id: number;
  module_name: string;
  short_description: string;
  is_active: boolean;
}

export default function BulkPermissionManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [action, setAction] = useState<'assign' | 'unassign'>('assign');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [results, setResults] = useState<{
    success: Array<{ user_id: number; module_id: number; action: string }>;
    failed: Array<{ user_id: number; module_id: number; error: string }>;
  } | null>(null);

  // Load initial data
  const loadData = async () => {
    try {
      setLoadingData(true);
      setError('');

      const [usersData, modulesData] = await Promise.all([
        userApi.getAllAdminUsers(),
        moduleApi.getAllModules()
      ]);

      setUsers(usersData.filter(user => user.is_active));
      setModules(modulesData.filter(module => module.is_active));
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle bulk operation
  const handleBulkOperation = async () => {
    if (selectedUsers.length === 0 || selectedModules.length === 0) {
      setError('Please select at least one user and one module');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setResults(null);

      const result = await accessOverviewApi.bulkAssignModules({
        user_ids: selectedUsers,
        module_ids: selectedModules,
        action
      });

      setResults(result.results);
      setSuccess(result.message);

      // Clear selections
      setSelectedUsers([]);
      setSelectedModules([]);

      // Refresh data
      loadData();
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle module selection
  const toggleModuleSelection = (moduleId: number) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Select all users
  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user.user_id));
  };

  // Clear all users
  const clearAllUsers = () => {
    setSelectedUsers([]);
  };

  // Select all modules
  const selectAllModules = () => {
    setSelectedModules(modules.map(module => module.module_id));
  };

  // Clear all modules
  const clearAllModules = () => {
    setSelectedModules([]);
  };

  if (loadingData) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Bulk Permission Management</h2>
          <p className="text-muted text-sm">Assign or unassign modules to multiple users at once</p>
        </div>
        <LoadingButton onClick={loadData} loading={loadingData} className="text-sm">
          Refresh
        </LoadingButton>
      </div>

      {/* Error/Success Messages */}
      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} />}

      {/* Action Selection */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Operation Type</h3>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="action"
              value="assign"
              checked={action === 'assign'}
              onChange={(e) => setAction(e.target.value as 'assign')}
              className="text-primary focus:ring-primary"
            />
            <span className="text-foreground">Assign Modules</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="action"
              value="unassign"
              checked={action === 'unassign'}
              onChange={(e) => setAction(e.target.value as 'unassign')}
              className="text-primary focus:ring-primary"
            />
            <span className="text-foreground">Unassign Modules</span>
          </label>
        </div>
      </div>

      {/* Selection Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground">Select Users</h3>
            <div className="flex space-x-2">
              <button
                onClick={selectAllUsers}
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAllUsers}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {users.map((user) => (
              <label key={user.user_id} className="flex items-center space-x-3 p-3 glass rounded-lg hover:bg-background/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.user_id)}
                  onChange={() => toggleUserSelection(user.user_id)}
                  className="text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-muted">{user.email}</div>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  user.user_type_id === 4
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : user.user_type_id === 3
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : user.user_type_id === 2
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  Type {user.user_type_id}
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 text-sm text-muted">
            {selectedUsers.length} of {users.length} users selected
          </div>
        </div>

        {/* Module Selection */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground">Select Modules</h3>
            <div className="flex space-x-2">
              <button
                onClick={selectAllModules}
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAllModules}
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {modules.map((module) => (
              <label key={module.module_id} className="flex items-center space-x-3 p-3 glass rounded-lg hover:bg-background/50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedModules.includes(module.module_id)}
                  onChange={() => toggleModuleSelection(module.module_id)}
                  className="text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">{module.module_name}</div>
                  <div className="text-sm text-muted">{module.short_description}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 text-sm text-muted">
            {selectedModules.length} of {modules.length} modules selected
          </div>
        </div>
      </div>

      {/* Operation Summary */}
      {(selectedUsers.length > 0 || selectedModules.length > 0) && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Operation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{selectedUsers.length}</div>
              <div className="text-sm text-muted">Users Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{selectedModules.length}</div>
              <div className="text-sm text-muted">Modules Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {selectedUsers.length * selectedModules.length}
              </div>
              <div className="text-sm text-muted">Total Operations</div>
            </div>
          </div>

          <div className="flex justify-center">
            <LoadingButton
              onClick={handleBulkOperation}
              loading={loading}
              disabled={selectedUsers.length === 0 || selectedModules.length === 0}
              className={`px-6 py-2 text-white rounded-lg transition-colors ${
                action === 'assign'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {action === 'assign' ? 'Assign' : 'Unassign'} {selectedUsers.length * selectedModules.length} Permissions
            </LoadingButton>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Operation Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Success */}
            <div>
              <h4 className="font-bold text-green-900 dark:text-green-400 mb-3">
                Successful ({results.success.length})
              </h4>
              {results.success.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.success.slice(0, 10).map((item, index) => (
                    <div key={index} className="text-sm text-muted">
                      User {item.user_id} → Module {item.module_id} ({item.action})
                    </div>
                  ))}
                  {results.success.length > 10 && (
                    <div className="text-sm text-muted">... and {results.success.length - 10} more</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted">No successful operations</div>
              )}
            </div>

            {/* Failed */}
            <div>
              <h4 className="font-bold text-red-900 dark:text-red-400 mb-3">
                Failed ({results.failed.length})
              </h4>
              {results.failed.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {results.failed.slice(0, 10).map((item, index) => (
                    <div key={index} className="text-sm text-muted">
                      User {item.user_id} → Module {item.module_id}: {item.error}
                    </div>
                  ))}
                  {results.failed.length > 10 && (
                    <div className="text-sm text-muted">... and {results.failed.length - 10} more</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted">No failed operations</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}