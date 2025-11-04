'use client';

import React, { useState, useEffect } from 'react';
import { CreateUserRequest, UpdateUserRequest, UserWithLoginStatus, UserType, handleApiError, getErrorType, isRecoverableError } from '../lib/api';
import { FormError, FormSuccess, Alert } from './FormError';
import { LoadingButton } from './LoadingSpinner';
import { useGlobalLoading } from './GlobalLoadingProvider';
import { NetworkErrorFallback, RateLimitFallback } from './FallbackUI';

interface UserFormProps {
  user?: UserWithLoginStatus | null;
  userTypes: UserType[];
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  isEdit?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  userTypes,
  onSubmit,
  onCancel,
  loading,
  error,
  success,
  isEdit = false,
}) => {
  const { withLoading } = useGlobalLoading();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    user_password: '',
    user_type_id: 0,
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<{
    type: 'network' | 'rate-limit' | 'server' | 'validation' | 'auth' | 'unknown';
    message: string;
    retryAfter?: number;
    canRetry: boolean;
  } | null>(null);

  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        user_password: '', // Don't populate password for editing
        user_type_id: user.user_type_id,
      });
    }
  }, [user, isEdit]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!isEdit) {
      if (!formData.user_password) {
        newErrors.user_password = 'Password is required';
      } else if (formData.user_password.length < 6) {
        newErrors.user_password = 'Password must be at least 6 characters';
      }

      if (formData.user_password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.user_type_id) {
      newErrors.user_type_id = 'User type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clear previous API errors
    setApiError(null);

    const submitData = isEdit
      ? {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          user_type_id: formData.user_type_id,
          ...(formData.user_password && { user_password: formData.user_password }),
        } as UpdateUserRequest
      : {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          user_password: formData.user_password,
          user_type_id: formData.user_type_id,
        } as CreateUserRequest;

    try {
      await withLoading(
        `user-form-${isEdit ? 'update' : 'create'}`,
        () => onSubmit(submitData),
        isEdit ? 'Updating user...' : 'Creating user...'
      );
    } catch (error: any) {
      const errorType = getErrorType(error);
      const canRetry = isRecoverableError(error);
      const retryAfter = error.details?.retryAfter ? Math.ceil(error.details.retryAfter / 1000) : undefined;

      setApiError({
        type: errorType,
        message: handleApiError(error),
        retryAfter,
        canRetry,
      });
    }
  };

  const handleRetry = () => {
    // Clear error and retry submission
    setApiError(null);
    // The form will be submitted again when user clicks submit
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError error={error} />}
      {success && <FormSuccess message={success} />}

      {/* API Error Handling */}
      {apiError && (
        <div className="mb-6">
          {apiError.type === 'network' && (
            <NetworkErrorFallback onRetry={apiError.canRetry ? handleRetry : undefined} />
          )}
          {apiError.type === 'rate-limit' && (
            <RateLimitFallback
              retryAfter={apiError.retryAfter}
              onRetry={apiError.canRetry && (!apiError.retryAfter || apiError.retryAfter <= 0) ? handleRetry : undefined}
            />
          )}
          {(apiError.type === 'server' || apiError.type === 'auth' || apiError.type === 'validation' || apiError.type === 'unknown') && (
            <Alert
              type={apiError.type === 'validation' ? 'warning' : 'error'}
              title={
                apiError.type === 'auth' ? 'Authentication Error' :
                apiError.type === 'validation' ? 'Validation Error' :
                apiError.type === 'server' ? 'Server Error' : 'Error'
              }
              message={apiError.message}
              onDismiss={() => setApiError(null)}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="first_name"
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.first_name ? 'border-red-500' : 'border-border'
            }`}
            placeholder="Enter first name"
          />
          {errors.first_name && <FormError error={errors.first_name} className="mt-1" />}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="last_name"
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.last_name ? 'border-red-500' : 'border-border'
            }`}
            placeholder="Enter last name"
          />
          {errors.last_name && <FormError error={errors.last_name} className="mt-1" />}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.email ? 'border-red-500' : 'border-border'
          }`}
          placeholder="Enter email address"
        />
        {errors.email && <FormError error={errors.email} className="mt-1" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label htmlFor="user_type_id" className="block text-sm font-medium text-foreground mb-1">
            User Type *
          </label>
          <select
            id="user_type_id"
            value={formData.user_type_id}
            onChange={(e) => handleInputChange('user_type_id', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.user_type_id ? 'border-red-500' : 'border-border'
            }`}
          >
            <option value={0}>Select user type</option>
            {userTypes.map((type) => (
              <option key={type.user_type_id} value={type.user_type_id}>
                {type.user_type_name}
              </option>
            ))}
          </select>
          {errors.user_type_id && <FormError error={errors.user_type_id} className="mt-1" />}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1">
          Address
        </label>
        <textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter address"
        />
      </div>

      {!isEdit && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user_password" className="block text-sm font-medium text-foreground mb-1">
                Password *
              </label>
              <input
                type="password"
                id="user_password"
                value={formData.user_password}
                onChange={(e) => handleInputChange('user_password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.user_password ? 'border-red-500' : 'border-border'
                }`}
                placeholder="Enter password"
              />
              {errors.user_password && <FormError error={errors.user_password} className="mt-1" />}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.confirmPassword ? 'border-red-500' : 'border-border'
                }`}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && <FormError error={errors.confirmPassword} className="mt-1" />}
            </div>
          </div>
        </>
      )}

      {isEdit && (
        <div>
          <label htmlFor="user_password" className="block text-sm font-medium text-foreground mb-1">
            New Password (leave blank to keep current)
          </label>
          <input
            type="password"
            id="user_password"
            value={formData.user_password}
            onChange={(e) => handleInputChange('user_password', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter new password"
          />
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-muted hover:text-foreground transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText={isEdit ? 'Updating...' : 'Creating...'}
          className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isEdit ? 'Update User' : 'Create User'}
        </LoadingButton>
      </div>
    </form>
  );
};