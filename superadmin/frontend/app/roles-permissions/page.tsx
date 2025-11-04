'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import { userApi, moduleApi, rolesApi, User, Module, handleApiError } from '../../lib/api';
import { LoadingSpinner, LoadingButton } from '../../components/LoadingSpinner';
import { Alert, FormError, FormSuccess } from '../../components/FormError';
import UserAccessMatrix from '../../components/UserAccessMatrix';
import UserTypePermissions from '../../components/UserTypePermissions';
import PermissionAnalytics from '../../components/PermissionAnalytics';
import BulkPermissionManagement from '../../components/BulkPermissionManagement';

interface UserModuleAssignment {
  user: User;
  modules: Module[];
}

export default function RolesPermissionsPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'user-types' | 'bulk' | 'analytics'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModules, setUserModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModules: 0,
    activeAssignments: 0
  });

  // Check if current user is admin
  const isAdmin = currentUser?.userType === 'Super Admin' || currentUser?.userType === 'Admin';

  // Load initial data
  const loadData = useCallback(async () => {
    // Only load data if user is authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [usersData, modulesData] = await Promise.all([
        userApi.getAllAdminUsers(),
        moduleApi.getAllModules()
      ]);

      setUsers(usersData);
      setAllModules(modulesData);
      setStats({
        totalUsers: usersData.length,
        totalModules: modulesData.length,
        activeAssignments: 0 // Will be calculated when user is selected
      });
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      // Check if this is an authentication error
      if (err.status === 401 || err.status === 403) {
        // Don't show error message for auth issues, let the auth provider handle it
        setError('');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load user modules when user is selected
  const loadUserModules = useCallback(async (userId: number) => {
    try {
      const modules = await rolesApi.getUserModules(userId);
      setUserModules(modules);
      setStats(prev => ({ ...prev, activeAssignments: modules.length }));
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      // Check if this is an authentication error
      if (err.status === 401 || err.status === 403) {
        // Don't show error message for auth issues, let the auth provider handle it
        setError('');
      } else {
        setError(errorMessage);
      }
    }
  }, []);

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    loadUserModules(user.user_id);
  };

  // Handle module assignment
  const handleAssignModule = async (moduleId: number) => {
    if (!selectedUser) return;

    try {
      setAssigning(true);
      setError('');
      setSuccess('');

      await rolesApi.assignModuleToUser({
        user_id: selectedUser.user_id,
        module_id: moduleId
      });

      setSuccess('Module assigned successfully');
      loadUserModules(selectedUser.user_id);
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      // Check if this is an authentication error
      if (err.status === 401 || err.status === 403) {
        // Don't show error message for auth issues, let the auth provider handle it
        setError('');
      } else {
        setError(errorMessage);
      }
    } finally {
      setAssigning(false);
    }
  };

  // Handle module unassignment
  const handleUnassignModule = async (moduleId: number) => {
    if (!selectedUser) return;

    try {
      setUnassigning(true);
      setError('');
      setSuccess('');

      await rolesApi.unassignModuleFromUser({
        user_id: selectedUser.user_id,
        module_id: moduleId
      });

      setSuccess('Module unassigned successfully');
      loadUserModules(selectedUser.user_id);
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      // Check if this is an authentication error
      if (err.status === 401 || err.status === 403) {
        // Don't show error message for auth issues, let the auth provider handle it
        setError('');
      } else {
        setError(errorMessage);
      }
    } finally {
      setUnassigning(false);
    }
  };

  // Build hierarchical module structure
  const buildModuleHierarchy = (modules: Module[]) => {
    const moduleMap = new Map<number, Module & { children: Module[] }>();
    const roots: (Module & { children: Module[] })[] = [];

    // Initialize all modules
    modules.forEach(module => {
      moduleMap.set(module.module_id, { ...module, children: [] } as Module & { children: Module[] });
    });

    // Build hierarchy
    modules.forEach(module => {
      const moduleWithChildren = moduleMap.get(module.module_id)!;
      if (module.parent_id === 0 || !moduleMap.has(module.parent_id)) {
        roots.push(moduleWithChildren);
      } else {
        const parent = moduleMap.get(module.parent_id);
        if (parent) {
          parent.children.push(moduleWithChildren);
        }
      }
    });

    return roots;
  };

  // Check if module is assigned to user
  const isModuleAssigned = (moduleId: number) => {
    return userModules.some(module => module.module_id === moduleId);
  };

  useEffect(() => {
    // Only load data when authentication state is determined and user is authenticated
    if (!authLoading && isAuthenticated) {
      loadData();
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, stop loading
      setLoading(false);
    }
  }, [loadData, authLoading, isAuthenticated]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Show authentication required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
            <p className="text-muted mb-6">You need to be logged in to access the Roles & Permissions page.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const hierarchicalModules = buildModuleHierarchy(allModules);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'matrix', label: 'Access Matrix', icon: '📋' },
    { id: 'user-types', label: 'User Types', icon: '👥' },
    { id: 'bulk', label: 'Bulk Management', icon: '⚡' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Roles & Permissions</h1>
          <p className="text-muted">Comprehensive user access management and permission overview</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 p-1 glass rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-muted hover:text-foreground hover:bg-background/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Error/Success Messages */}
            {error && <Alert type="error" message={error} onDismiss={() => setError('')} className="mb-6" />}
            {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} className="mb-6" />}

            {/* Welcome Section */}
            <div className="glass rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Roles & Permissions</h2>
                  <p className="text-muted">Manage user access, assign modules, and control permissions across your system</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-muted">Last updated</p>
                    <p className="text-sm font-medium text-foreground">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => setActiveTab('matrix')}
                className="glass rounded-xl p-4 hover:bg-background/50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition-colors">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-foreground mb-1">Access Matrix</h3>
                <p className="text-xs text-muted">View all permissions at a glance</p>
              </button>

              <button
                onClick={() => setActiveTab('user-types')}
                className="glass rounded-xl p-4 hover:bg-background/50 transition-all group"
              >
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-500/30 transition-colors">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-foreground mb-1">User Types</h3>
                <p className="text-xs text-muted">Manage role hierarchies</p>
              </button>

              <button
                onClick={() => setActiveTab('bulk')}
                className="glass rounded-xl p-4 hover:bg-background/50 transition-all group"
              >
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-500/30 transition-colors">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-medium text-foreground mb-1">Bulk Actions</h3>
                <p className="text-xs text-muted">Mass permission updates</p>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className="glass rounded-xl p-4 hover:bg-background/50 transition-all group"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-500/30 transition-colors">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-foreground mb-1">Analytics</h3>
                <p className="text-xs text-muted">Permission insights</p>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                    <p className="text-muted text-sm">Total Users</p>
                    <div className="flex items-center mt-1">
                      <div className="w-16 h-1 bg-purple-500/30 rounded-full">
                        <div className="h-1 bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalModules}</p>
                    <p className="text-muted text-sm">Total Modules</p>
                    <div className="flex items-center mt-1">
                      <div className="w-16 h-1 bg-blue-500/30 rounded-full">
                        <div className="h-1 bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.activeAssignments}</p>
                    <p className="text-muted text-sm">Active Assignments</p>
                    <div className="flex items-center mt-1">
                      <div className="w-16 h-1 bg-green-500/30 rounded-full">
                        <div className="h-1 bg-green-500 rounded-full" style={{ width: `${stats.totalUsers > 0 ? (stats.activeAssignments / (stats.totalUsers * stats.totalModules)) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.max(0, (stats.totalUsers * stats.totalModules) - stats.activeAssignments)}
                    </p>
                    <p className="text-muted text-sm">Unassigned</p>
                    <div className="flex items-center mt-1">
                      <div className="w-16 h-1 bg-orange-500/30 rounded-full">
                        <div className="h-1 bg-orange-500 rounded-full" style={{ width: `${stats.totalUsers > 0 ? (((stats.totalUsers * stats.totalModules) - stats.activeAssignments) / (stats.totalUsers * stats.totalModules)) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Module Assignment */}
              <div className="glass rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">User Module Assignment</h2>
                  {isAdmin && (
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-sm text-primary hover:text-primary-hover transition-colors"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* User Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUser?.user_id || ''}
                    onChange={(e) => {
                      const userId = parseInt(e.target.value);
                      const user = users.find(u => u.user_id === userId);
                      if (user) handleUserSelect(user);
                    }}
                    className="w-full px-3 py-2 glass rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    disabled={!isAdmin}
                  >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module Assignment */}
                {selectedUser && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">
                      Assign Modules to {selectedUser.first_name} {selectedUser.last_name}
                    </h3>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {hierarchicalModules.map(module => (
                        <ModuleItem
                          key={module.module_id}
                          module={module}
                          level={0}
                          isAssigned={isModuleAssigned(module.module_id)}
                          onAssign={handleAssignModule}
                          onUnassign={handleUnassignModule}
                          assigning={assigning}
                          unassigning={unassigning}
                          disabled={!isAdmin}
                          isModuleAssigned={isModuleAssigned}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!selectedUser && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Select a User</h3>
                    <p className="text-muted">Choose a user from the dropdown above to manage their module assignments.</p>
                  </div>
                )}
              </div>

              {/* User Permissions Overview */}
              <div className="glass rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">User Permissions Overview</h2>
                </div>

                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </h3>
                        <p className="text-sm text-muted">{selectedUser.email}</p>
                        <p className="text-xs text-muted">User Type: {selectedUser.user_type_id}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Assigned Modules ({userModules.length})</h4>
                      {userModules.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {userModules.map(module => (
                            <div key={module.module_id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div>
                                <p className="font-bold text-green-900 dark:text-green-200">{module.module_name}</p>
                                <p className="text-sm font-bold text-green-900 dark:text-green-400">{module.short_description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
                                  Active
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <p className="text-muted">No modules assigned yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Select a User</h3>
                    <p className="text-muted">Choose a user to view their current permissions and module assignments.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'matrix' && <UserAccessMatrix onUserSelect={(userId) => {
          const user = users.find(u => u.user_id === userId);
          if (user) {
            setSelectedUser(user);
            setActiveTab('overview');
          }
        }} />}

        {activeTab === 'user-types' && <UserTypePermissions />}

        {activeTab === 'bulk' && <BulkPermissionManagement />}

        {activeTab === 'analytics' && <PermissionAnalytics />}
      </div>
    </div>
  );
}

// Module Item Component for hierarchical display
interface ModuleItemProps {
  module: Module & { children: Module[] };
  level: number;
  isAssigned: boolean;
  onAssign: (moduleId: number) => void;
  onUnassign: (moduleId: number) => void;
  assigning: boolean;
  unassigning: boolean;
  disabled: boolean;
  isModuleAssigned?: (moduleId: number) => boolean;
}

function ModuleItem({
  module,
  level,
  isAssigned,
  onAssign,
  onUnassign,
  assigning,
  unassigning,
  disabled,
  isModuleAssigned
}: ModuleItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = module.children.length > 0;

  return (
    <div className={`${level > 0 ? 'ml-6' : ''}`}>
      <div className="flex items-center justify-between p-3 glass rounded-lg hover:bg-background/50 transition-colors">
        <div className="flex items-center space-x-3">
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted hover:text-foreground transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <div>
            <p className="font-medium text-foreground">{module.module_name}</p>
            <p className="text-sm text-muted">{module.short_description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isAssigned ? (
            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
              Assigned
            </span>
          ) : (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full">
              Not Assigned
            </span>
          )}

          {isAssigned ? (
            <LoadingButton
              loading={unassigning}
              onClick={() => onUnassign(module.module_id)}
              disabled={disabled || unassigning}
              className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
            >
              Unassign
            </LoadingButton>
          ) : (
            <LoadingButton
              loading={assigning}
              onClick={() => onAssign(module.module_id)}
              disabled={disabled || assigning}
              className="px-3 py-1 text-xs bg-primary hover:bg-primary-hover text-white rounded transition-colors"
            >
              Assign
            </LoadingButton>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-2 space-y-2">
          {module.children.map(child => (
            <ModuleItem
              key={child.module_id}
              module={child as Module & { children: Module[] }}
              level={level + 1}
              isAssigned={isModuleAssigned ? isModuleAssigned(child.module_id) : false} // Check assignment for each child
              onAssign={onAssign}
              onUnassign={onUnassign}
              assigning={assigning}
              unassigning={unassigning}
              disabled={disabled}
              isModuleAssigned={isModuleAssigned}
            />
          ))}
        </div>
      )}
    </div>
  );
}