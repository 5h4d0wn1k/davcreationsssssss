'use client';

import React from 'react';
import { UserWithLoginStatus, UserType, CreateUserRequest, UpdateUserRequest } from '../lib/api';
import { UserTable } from './UserTable';
import { UserModal } from './UserModal';
import { Alert } from './FormError';

interface UsersTabProps {
  users: UserWithLoginStatus[];
  userTypes: UserType[];
  loading: boolean;
  error: string | null;
  success: string | null;
  onEdit: (user: UserWithLoginStatus) => void;
  onDelete: (userId: number) => void;
  onRecover: (userId: number) => void;
  onLogout: (userId: number) => void;
  onChangeRole: (userId: number, newRole: string) => void;
  onCreate: () => void;
  currentUserRole: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export function UsersTab({ users, userTypes, loading, error, success, onEdit, onDelete, onRecover, onLogout, onChangeRole, onCreate, currentUserRole, isAdmin, isOwner }: UsersTabProps) {
  const userStats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  return (
    <>
      {success && <Alert type="success" message={success} className="mb-6" onDismiss={() => {}} />}
      {error && <Alert type="error" message={error} className="mb-6" onDismiss={() => {}} />}

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

      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">All Users</h2>
          {(isAdmin || isOwner) && (
            <button
              onClick={onCreate}
              className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Add New User
            </button>
          )}
        </div>

        <UserTable
          users={users}
          userTypes={userTypes}
          loading={loading}
          error={error}
          onEdit={onEdit}
          onDelete={onDelete}
          onRecover={onRecover}
          onLogout={onLogout}
          onChangeRole={onChangeRole}
          currentUserRole={currentUserRole}
          isAdmin={isAdmin}
          isOwner={isOwner}
        />
      </div>
    </>
  );
}
