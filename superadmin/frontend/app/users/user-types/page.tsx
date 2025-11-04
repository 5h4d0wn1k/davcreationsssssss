'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { rolesApi, handleApiError, UserType, CreateUserTypeRequest, UpdateUserTypeRequest } from '../../../lib/api';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { Alert } from '../../../components/FormError';

interface UserTypeStats {
  total: number;
  active: number;
  inactive: number;
}

export default function UserTypesPage() {
  const { user: currentUser } = useAuth();
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [stats, setStats] = useState<UserTypeStats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserType, setEditingUserType] = useState<UserType | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Role-based access
  const isOwner = currentUser?.userType === 'superadmin';

  const fetchUserTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const types = await rolesApi.getAllUserTypes();
      setUserTypes(types);

      // Calculate stats
      const total = types.length;
      const active = types.filter(t => t.is_active).length;
      const inactive = total - active;
      setStats({ total, active, inactive });
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserTypes();
  }, [fetchUserTypes]);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

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
      showSuccess('User type created successfully!');
    } catch (err: any) {
      setModalError(handleApiError(err));
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
      showSuccess('User type updated successfully!');
    } catch (err: any) {
      setModalError(handleApiError(err));
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
      showSuccess('User type deleted successfully!');
    } catch (err: any) {
      showError(handleApiError(err));
    }
  };

  const handleEditUserType = (userType: UserType) => {
    setEditingUserType(userType);
    setIsModalOpen(true);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleCreateNewUserType = () => {
    setEditingUserType(null);
    setIsModalOpen(true);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUserType(null);
    setModalError(null);
    setModalSuccess(null);
  };

  const getRoleBadgeColor = (value: number) => {
    if (value >= 4) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    if (value >= 3) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    if (value >= 2) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Types Management</h1>
          <p className="text-muted">Manage user roles and their hierarchy levels</p>
        </div>

        {/* Success/Error Messages */}
        {success && <Alert type="success" message={success} className="mb-6" onDismiss={() => setSuccess(null)} />}
        {error && <Alert type="error" message={error} className="mb-6" onDismiss={() => setError(null)} />}

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
                <p className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.active.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.inactive.toLocaleString()}</p>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(userType.user_type_value)}`}>
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

        {/* User Type Modal */}
        <UserTypeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          userType={editingUserType}
          onSubmit={(data: CreateUserTypeRequest | UpdateUserTypeRequest) => {
            if (editingUserType) {
              return handleUpdateUserType(data as UpdateUserTypeRequest);
            } else {
              return handleCreateUserType(data as CreateUserTypeRequest);
            }
          }}
          loading={modalLoading}
          error={modalError}
          success={modalSuccess}
          isEdit={!!editingUserType}
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
  const [formData, setFormData] = useState({
    user_type_name: '',
    user_type_value: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userType && isEdit) {
      setFormData({
        user_type_name: userType.user_type_name,
        user_type_value: userType.user_type_value,
      });
    } else {
      setFormData({
        user_type_name: '',
        user_type_value: 1,
      });
    }
  }, [userType, isEdit]);

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
        } as UpdateUserTypeRequest
      : {
          user_type_name: formData.user_type_name,
          user_type_value: formData.user_type_value,
        } as CreateUserTypeRequest;

    await onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {isEdit ? 'Edit User Type' : 'Create New User Type'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <div>
            <label htmlFor="user_type_name" className="block text-sm font-medium text-foreground mb-1">
              User Type Name *
            </label>
            <input
              type="text"
              id="user_type_name"
              value={formData.user_type_name}
              onChange={(e) => handleInputChange('user_type_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.user_type_name ? 'border-red-500' : 'border-border'
              }`}
              placeholder="Enter user type name"
            />
            {errors.user_type_name && <p className="mt-1 text-sm text-red-900 font-bold">{errors.user_type_name}</p>}
          </div>

          <div>
            <label htmlFor="user_type_value" className="block text-sm font-medium text-foreground mb-1">
              Hierarchy Value *
            </label>
            <select
              id="user_type_value"
              value={formData.user_type_value}
              onChange={(e) => handleInputChange('user_type_value', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.user_type_value ? 'border-red-500' : 'border-border'
              }`}
            >
              <option value={1}>1 - Basic User</option>
              <option value={2}>2 - Manager</option>
              <option value={3}>3 - Admin</option>
              <option value={4}>4 - Super Admin</option>
            </select>
            {errors.user_type_value && <p className="mt-1 text-sm text-red-600">{errors.user_type_value}</p>}
            <p className="mt-1 text-xs text-muted">
              Higher values indicate higher permissions in the hierarchy.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted hover:text-foreground transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}