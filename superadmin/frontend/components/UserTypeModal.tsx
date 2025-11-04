'use client';

import React, { useState } from 'react';
import { Alert } from './FormError';
import { UserType } from '../lib/api';

interface UserTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: UserType | null;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
  isEdit?: boolean;
}

interface FormData {
  user_type_name: string;
  user_type_value: number;
}

export function UserTypeModal({
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

    await onSubmit(formData);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
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
            {errors.user_type_value && <p className="mt-1 text-sm text-red-900 font-bold">{errors.user_type_value}</p>}
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
