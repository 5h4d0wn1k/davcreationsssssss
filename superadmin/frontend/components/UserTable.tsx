'use client';

import React, { useState } from 'react';
import { UserWithLoginStatus, UserType } from '../lib/api';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert } from './FormError';

interface UserTableProps {
  users: UserWithLoginStatus[];
  userTypes: UserType[];
  loading: boolean;
  error: string | null;
  onEdit: (user: UserWithLoginStatus) => void;
  onDelete: (userId: number) => void;
  onRecover: (userId: number) => void;
  onLogout: (userId: number) => void;
  onChangeRole: (userId: number, newRole: string) => void;
  currentUserRole: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  userTypes,
  loading,
  error,
  onEdit,
  onDelete,
  onRecover,
  onLogout,
  onChangeRole,
  currentUserRole,
  isAdmin,
  isOwner,
}) => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.user_id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        return 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-300';
      case 'admin':
        return 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300';
      case 'manager':
        return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-900 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const canManageUser = (user: UserWithLoginStatus) => {
    if (isOwner) return true;
    if (!isAdmin) return false;

    const hierarchy: Record<string, number> = { superadmin: 4, admin: 3, manager: 2, user: 1 };
    const currentUserLevel = hierarchy[currentUserRole.toLowerCase()] || 0;
    const targetUserLevel = hierarchy[user.userType.toLowerCase()] || 0;

    return currentUserLevel > targetUserLevel;
  };

  // Filter and sort users
  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = searchTerm === '' ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);

      const matchesRole = roleFilter === 'all' || user.userType === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.userType.toLowerCase();
          bValue = b.userType.toLowerCase();
          break;
        case 'status':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, statusFilter, roleFilter, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} selected user(s)? This action cannot be undone.`)) {
      return;
    }
    // Implement bulk delete logic
    selectedUsers.forEach(userId => onDelete(userId));
    setSelectedUsers([]);
  };

  const handleBulkStatusChange = (newStatus: boolean) => {
    if (selectedUsers.length === 0) return;
    // Implement bulk status change logic
    console.log(`Changing status of ${selectedUsers.length} users to ${newStatus ? 'active' : 'inactive'}`);
    setSelectedUsers([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div>
      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Roles</option>
              {userTypes.map(type => (
                <option key={type.user_type_id} value={type.user_type_name}>
                  {type.user_type_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (isAdmin || isOwner) && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-800">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => handleBulkStatusChange(true)}
                className="px-3 py-1 text-xs bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 rounded"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusChange(false)}
                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-900 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 rounded"
              >
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-xs bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-border"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="text-sm font-medium text-muted hover:text-foreground flex items-center gap-1"
                >
                  Name
                  {sortBy === 'name' && (
                    <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('email')}
                  className="text-sm font-medium text-muted hover:text-foreground flex items-center gap-1"
                >
                  Email
                  {sortBy === 'email' && (
                    <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('role')}
                  className="text-sm font-medium text-muted hover:text-foreground flex items-center gap-1"
                >
                  Role
                  {sortBy === 'role' && (
                    <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="text-sm font-medium text-muted hover:text-foreground flex items-center gap-1"
                >
                  Status
                  {sortBy === 'status' && (
                    <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted">Login Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map((user) => (
              <tr key={user.user_id} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.user_id)}
                    onChange={(e) => handleSelectUser(user.user_id, e.target.checked)}
                    className="rounded border-border"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">
                    {user.first_name} {user.last_name}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.userType)}`}>
                    {user.userType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_active
                      ? 'bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.isLoggedIn
                      ? 'bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}>
                    {user.isLoggedIn ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    {(isAdmin || isOwner) && (
                      <button
                        onClick={() => onEdit(user)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit user"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}

                    {canManageUser(user) && user.is_active && (
                      <button
                        onClick={() => onDelete(user.user_id)}
                        className="text-red-900 font-bold hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete user"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}

                    {canManageUser(user) && !user.is_active && (
                      <button
                        onClick={() => onRecover(user.user_id)}
                        className="text-green-900 font-bold hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="Recover user"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}

                    {canManageUser(user) && user.isLoggedIn && (
                      <button
                        onClick={() => onLogout(user.user_id)}
                        className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                        title="Logout user"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    )}

                    {canManageUser(user) && (
                      <select
                        value={user.userType}
                        onChange={(e) => onChangeRole(user.user_id, e.target.value)}
                        className="text-xs border border-border rounded px-2 py-1 bg-background"
                      >
                        {userTypes.map((type) => (
                          <option key={type.user_type_id} value={type.user_type_name}>
                            {type.user_type_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {users.length === 0 ? 'No users found' : 'No users match your filters'}
            </h3>
            <p className="text-muted">
              {users.length === 0 ? 'Get started by creating your first user.' : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};