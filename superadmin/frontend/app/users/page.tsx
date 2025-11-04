'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { userApi, rolesApi, moduleApi, handleApiError, UserWithLoginStatus, UserType, CreateUserRequest, UpdateUserRequest, Module, UserAccess, ApiError } from '../../lib/api';
import { UserTable } from '../../components/UserTable';
import { UserModal } from '../../components/UserModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Alert } from '../../components/FormError';

interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

interface CreateUserTypeRequest {
  user_type_name: string;
  user_type_value: number;
}

interface UpdateUserTypeRequest {
  user_type_name: string;
  user_type_value: number;
}

export default function UsersPage() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'user-types' | 'modules'>('users');

  // Users tab state
  const [users, setUsers] = useState<UserWithLoginStatus[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, active: 0, inactive: 0 });
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersSuccess, setUsersSuccess] = useState<string | null>(null);

  // User Types tab state
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [userTypesStats, setUserTypesStats] = useState<UserStats>({ total: 0, active: 0, inactive: 0 });
  const [userTypesLoading, setUserTypesLoading] = useState(false);
  const [userTypesError, setUserTypesError] = useState<string | null>(null);
  const [userTypesSuccess, setUserTypesSuccess] = useState<string | null>(null);

  // Modules tab state
  const [modules, setModules] = useState<Module[]>([]);
  const [userModules, setUserModules] = useState<{ [userId: number]: Module[] }>({});
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [modulesSuccess, setModulesSuccess] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithLoginStatus | null>(null);
  const [editingUserType, setEditingUserType] = useState<UserType | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Role-based access
  const isAdmin = currentUser?.userType === 'admin' || currentUser?.userType === 'superadmin';
  const isOwner = currentUser?.userType === 'superadmin';

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const usersData = await userApi.getAllUsers();
      setUsers(usersData);

      // Calculate stats
      const total = usersData.length;
      const active = usersData.filter(u => u.is_active).length;
      const inactive = total - active;
      setUserStats({ total, active, inactive });
    } catch (err: unknown) {
      setUsersError(handleApiError(err as ApiError));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchUserTypes = useCallback(async () => {
    try {
      setUserTypesLoading(true);
      setUserTypesError(null);
      const types = await rolesApi.getAllUserTypes();
      setUserTypes(types);

      // Calculate stats
      const total = types.length;
      const active = types.filter(t => t.is_active).length;
      const inactive = total - active;
      setUserTypesStats({ total, active, inactive });
    } catch (err: unknown) {
      setUserTypesError(handleApiError(err as ApiError));
    } finally {
      setUserTypesLoading(false);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      setModulesLoading(true);
      setModulesError(null);
      const modulesData = await moduleApi.getAllModules();
      setModules(modulesData);
    } catch (err: unknown) {
      setModulesError(handleApiError(err as ApiError));
    } finally {
      setModulesLoading(false);
    }
  }, []);

  const fetchUserModules = useCallback(async (userId: number) => {
    try {
      const userModulesData = await rolesApi.getUserModules(userId);
      setUserModules(prev => ({ ...prev, [userId]: userModulesData }));
    } catch (err: unknown) {
      console.error('Failed to fetch user modules:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchUsers();
      if (activeTab === 'user-types') fetchUserTypes();
      if (activeTab === 'modules') fetchModules();
    }
  }, [fetchUsers, activeTab, isAuthenticated, isLoading]);

  const showUsersSuccess = (message: string) => {
    setUsersSuccess(message);
    setTimeout(() => setUsersSuccess(null), 5000);
  };

  const showUsersError = (message: string) => {
    setUsersError(message);
    setTimeout(() => setUsersError(null), 5000);
  };

  const showUserTypesSuccess = (message: string) => {
    setUserTypesSuccess(message);
    setTimeout(() => setUserTypesSuccess(null), 5000);
  };

  const showUserTypesError = (message: string) => {
    setUserTypesError(message);
    setTimeout(() => setUserTypesError(null), 5000);
  };

  const showModulesSuccess = (message: string) => {
    setModulesSuccess(message);
    setTimeout(() => setModulesSuccess(null), 5000);
  };

  const showModulesError = (message: string) => {
    setModulesError(message);
    setTimeout(() => setModulesError(null), 5000);
  };

  const handleCreateUser = async (data: CreateUserRequest) => {
    try {
      setModalLoading(true);
      setModalError(null);
      setModalSuccess(null);

      await userApi.createUser(data);
      setModalSuccess('User created successfully!');
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
      showUsersSuccess('User created successfully!');
    } catch (err: unknown) {
      setModalError(handleApiError(err as ApiError));
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateUser = async (data: UpdateUserRequest) => {
    if (!editingUser) return;

    try {
      setModalLoading(true);
      setModalError(null);
      setModalSuccess(null);

      await userApi.updateUser(editingUser.user_id, data);
      setModalSuccess('User updated successfully!');
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
      showUsersSuccess('User updated successfully!');
    } catch (err: unknown) {
      setModalError(handleApiError(err as ApiError));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userApi.deleteUser(userId);
      await fetchUsers();
      showUsersSuccess('User deleted successfully!');
    } catch (err: unknown) {
      showUsersError(handleApiError(err as ApiError));
    }
  };

  const handleRecoverUser = async (userId: number) => {
    try {
      await userApi.recoverUser(userId);
      await fetchUsers();
      showUsersSuccess('User recovered successfully!');
    } catch (err: unknown) {
      showUsersError(handleApiError(err as ApiError));
    }
  };

  const handleLogoutUser = async (userId: number) => {
    try {
      await userApi.logoutUserByAdmin(userId);
      await fetchUsers();
      showUsersSuccess('User logged out successfully!');
    } catch (err: unknown) {
      showUsersError(handleApiError(err as ApiError));
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      await userApi.changeUserRole(userId, { user_type_name: newRole });
      await fetchUsers();
      showUsersSuccess('User role updated successfully!');
    } catch (err: unknown) {
      showUsersError(handleApiError(err as ApiError));
    }
  };

  // User Types handlers
  const handleCreateUserType = async (data: CreateUserTypeRequest) => {
    try {
      setModalLoading(true);
      setModalError(null);
      setModalSuccess(null);

      await rolesApi.createUserType(data);
      setModalSuccess('User type created successfully!');
      setIsModalOpen(false);
      setEditingUserType(null);
      await fetchUserTypes();
      showUserTypesSuccess('User type created successfully!');
    } catch (err: unknown) {
      setModalError(handleApiError(err as ApiError));
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateUserType = async (data: UpdateUserTypeRequest) => {
    if (!editingUserType) return;

    try {
      setModalLoading(true);
      setModalError(null);
      setModalSuccess(null);

      await rolesApi.updateUserType(editingUserType.user_type_id, data);
      setModalSuccess('User type updated successfully!');
      setIsModalOpen(false);
      setEditingUserType(null);
      await fetchUserTypes();
      showUserTypesSuccess('User type updated successfully!');
    } catch (err: unknown) {
      setModalError(handleApiError(err as ApiError));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUserType = async (userTypeId: number) => {
    if (!confirm('Are you sure you want to delete this user type? This action cannot be undone.')) {
      return;
    }

    try {
      await rolesApi.deleteUserType(userTypeId);
      await fetchUserTypes();
      showUserTypesSuccess('User type deleted successfully!');
    } catch (err: unknown) {
      showUserTypesError(handleApiError(err as ApiError));
    }
  };

  // Module assignment handlers
  const handleAssignModule = async (userId: number, moduleId: number) => {
    try {
      await rolesApi.assignModuleToUser({ user_id: userId, module_id: moduleId });
      await fetchUserModules(userId);
      showModulesSuccess('Module assigned successfully!');
    } catch (err: unknown) {
      showModulesError(handleApiError(err as ApiError));
    }
  };

  const handleUnassignModule = async (userId: number, moduleId: number) => {
    try {
      await rolesApi.unassignModuleFromUser({ user_id: userId, module_id: moduleId });
      await fetchUserModules(userId);
      showModulesSuccess('Module unassigned successfully!');
    } catch (err: unknown) {
      showModulesError(handleApiError(err as ApiError));
    }
  };

  const handleEditUser = (user: UserWithLoginStatus) => {
    setEditingUser(user);
    setEditingUserType(null);
    setIsModalOpen(true);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleCreateNewUser = () => {
    setEditingUser(null);
    setEditingUserType(null);
    setIsModalOpen(true);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleEditUserType = (userType: UserType) => {
    setEditingUserType(userType);
    setEditingUser(null);
    setIsModalOpen(true);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleCreateNewUserType = () => {
    setEditingUserType(null);
    setEditingUser(null);
    setIsModalOpen(true);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setEditingUserType(null);
    setModalError(null);
    setModalSuccess(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <>
            {/* Success/Error Messages */}
            {usersSuccess && <Alert type="success" message={usersSuccess} className="mb-6" onDismiss={() => setUsersSuccess(null)} />}
            {usersError && <Alert type="error" message={usersError} className="mb-6" onDismiss={() => setUsersError(null)} />}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{userStats.total.toLocaleString()}</p>
                    <p className="text-muted text-sm">Total Users</p>
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
                    <p className="text-2xl font-bold text-foreground">{userStats.active.toLocaleString()}</p>
                    <p className="text-muted text-sm">Active Users</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{userStats.inactive.toLocaleString()}</p>
                    <p className="text-muted text-sm">Inactive Users</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">All Users</h2>
                {(isAdmin || isOwner) && (
                  <button
                    onClick={handleCreateNewUser}
                    className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Add New User
                  </button>
                )}
              </div>

              <UserTable
                users={users}
                userTypes={userTypes}
                loading={usersLoading}
                error={usersError}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onRecover={handleRecoverUser}
                onLogout={handleLogoutUser}
                onChangeRole={handleChangeRole}
                currentUserRole={currentUser?.userType || ''}
                isAdmin={isAdmin}
                isOwner={isOwner}
              />
            </div>
          </>
        );

      case 'user-types':
        return (
          <>
            {/* Success/Error Messages */}
            {userTypesSuccess && <Alert type="success" message={userTypesSuccess} className="mb-6" onDismiss={() => setUserTypesSuccess(null)} />}
            {userTypesError && <Alert type="error" message={userTypesError} className="mb-6" onDismiss={() => setUserTypesError(null)} />}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{userTypesStats.total.toLocaleString()}</p>
                    <p className="text-muted text-sm">Total User Types</p>
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
                    <p className="text-2xl font-bold text-foreground">{userTypesStats.active.toLocaleString()}</p>
                    <p className="text-muted text-sm">Active Types</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{userTypesStats.inactive.toLocaleString()}</p>
                    <p className="text-muted text-sm">Inactive Types</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">All User Types</h2>
                {isOwner && (
                  <button
                    onClick={handleCreateNewUserType}
                    className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Add New User Type
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted">Type Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted">Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted">Created Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userTypes.map((userType) => (
                      <tr key={userType.user_type_id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {userType.user_type_name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${userType.user_type_value >= 4 ? 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-300' : userType.user_type_value >= 3 ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300' : userType.user_type_value >= 2 ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300' : 'bg-gray-100 text-gray-900 dark:bg-gray-900/20 dark:text-gray-300'}`}>
                            {userType.user_type_value}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            userType.is_active
                              ? 'bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {userType.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {userType.created_date ? new Date(userType.created_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {isOwner && (
                              <>
                                <button
                                  onClick={() => handleEditUserType(userType)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Edit user type"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>

                                <button
                                  onClick={() => handleDeleteUserType(userType.user_type_id)}
                                  className="text-red-900 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold"
                                  title="Delete user type"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {userTypes.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-foreground mb-2">No user types found</h3>
                    <p className="text-muted">Get started by creating your first user type.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        );

      case 'modules':
        return (
          <>
            {/* Success/Error Messages */}
            {modulesSuccess && <Alert type="success" message={modulesSuccess} className="mb-6" onDismiss={() => setModulesSuccess(null)} />}
            {modulesError && <Alert type="error" message={modulesError} className="mb-6" onDismiss={() => setModulesError(null)} />}

            {/* Module Assignment Interface */}
            <div className="glass rounded-2xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Module/Feature Assignment</h2>
                <p className="text-muted">Assign specific modules and features to users for granular access control</p>
              </div>

              <div className="space-y-6">
                {users.map((user) => (
                  <div key={user.user_id} className="border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-foreground">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-muted">{user.email} • {user.userType}</p>
                      </div>
                      <button
                        onClick={() => fetchUserModules(user.user_id)}
                        className="text-primary hover:text-primary-hover text-sm"
                      >
                        Refresh Modules
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {modules.map((module) => {
                        const isAssigned = userModules[user.user_id]?.some(um => um.module_id === module.module_id);
                        return (
                          <div key={module.module_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{module.module_name}</p>
                              <p className="text-xs text-muted">{module.short_description}</p>
                            </div>
                            <button
                              onClick={() => isAssigned ? handleUnassignModule(user.user_id, module.module_id) : handleAssignModule(user.user_id, module.module_id)}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                isAssigned
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-300'
                              }`}
                            >
                              {isAssigned ? 'Assigned' : 'Assign'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
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
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
            <p className="text-muted">Please log in to access the user management system.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management System</h1>
          <p className="text-muted">Comprehensive user administration, role management, and feature access control</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'users'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Users & CRUD
            </button>
            <button
              onClick={() => setActiveTab('user-types')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'user-types'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              User Types & Roles
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'modules'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Module Assignment
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* User Modal */}
        <UserModal
          isOpen={isModalOpen && !editingUserType}
          onClose={handleCloseModal}
          user={editingUser}
          userTypes={userTypes}
          onSubmit={(data: CreateUserRequest | UpdateUserRequest) => {
            if (editingUser) {
              return handleUpdateUser(data as UpdateUserRequest);
            } else {
              return handleCreateUser(data as CreateUserRequest);
            }
          }}
          loading={modalLoading}
          error={modalError}
          success={modalSuccess}
          isEdit={!!editingUser}
          key={`user-${editingUser?.user_id || 'create'}`}
        />

        {/* User Type Modal */}
        <UserTypeModal
          isOpen={isModalOpen && !editingUser}
          onClose={handleCloseModal}
          userType={editingUserType}
          onSubmit={editingUserType ? handleUpdateUserType : handleCreateUserType}
          loading={modalLoading}
          error={modalError}
          success={modalSuccess}
          isEdit={!!editingUserType}
          key={`usertype-${editingUserType?.user_type_id || 'create'}`}
        />
      </div>
    </div>
  );
}

// User Type Modal Component
interface UserTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: UserType | null;
  onSubmit: (data: CreateUserTypeRequest | UpdateUserTypeRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
  isEdit?: boolean;
}

interface FormData {
  user_type_name: string;
  user_type_value: number;
}

function UserTypeModal({
  isOpen,
  onClose,
  userType,
  onSubmit,
  loading,
  error,
  success,
  isEdit = false,
}: UserTypeModalProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (userType && isEdit) {
      return {
        user_type_name: userType.user_type_name,
        user_type_value: userType.user_type_value,
      };
    } else {
      return {
        user_type_name: '',
        user_type_value: 1,
      };
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_type_name.trim()) {
      newErrors.user_type_name = 'User type name is required';
    }

    if (formData.user_type_value < 1 || formData.user_type_value > 4) {
      newErrors.user_type_value = 'User type value must be between 1 and 4';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = isEdit
      ? {
          user_type_name: formData.user_type_name,
          user_type_value: formData.user_type_value,
        }
      : {
          user_type_name: formData.user_type_name,
          user_type_value: formData.user_type_value,
        };

    await onSubmit(submitData);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;
}