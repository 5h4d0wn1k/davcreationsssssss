'use client';

import React from 'react';
import { UserType } from '../lib/api';
import { Alert } from './FormError';

interface UserTypesTabProps {
  userTypes: UserType[];
  loading: boolean;
  error: string | null;
  success: string | null;
  onEdit: (userType: UserType) => void;
  onDelete: (userTypeId: number) => void;
  onCreate: () => void;
  isOwner: boolean;
}

export function UserTypesTab({ userTypes, loading, error, success, onEdit, onDelete, onCreate, isOwner }: UserTypesTabProps) {
  const userTypesStats = {
    total: userTypes.length,
    active: userTypes.filter(t => t.is_active).length,
    inactive: userTypes.filter(t => !t.is_active).length,
  };

  return (
    <>
      {success && <Alert type="success" message={success} className="mb-6" onDismiss={() => {}} />}
      {error && <Alert type="error" message={error} className="mb-6" onDismiss={() => {}} />}

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

      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">All User Types</h2>
          {isOwner && (
            <button
              onClick={onCreate}
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
                            onClick={() => onEdit(userType)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit user type"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => onDelete(userType.user_type_id)}
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
}
