'use client';

import React, { useEffect } from 'react';
import { UserForm } from './UserForm';
import { CreateUserRequest, UpdateUserRequest, UserWithLoginStatus, UserType } from '../lib/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserWithLoginStatus | null;
  userTypes: UserType[];
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
  isEdit?: boolean;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  userTypes,
  onSubmit,
  loading,
  error,
  success,
  isEdit = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative glass rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {isEdit ? 'Edit User' : 'Create New User'}
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

        <UserForm
          user={user}
          userTypes={userTypes}
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
          error={error}
          success={success}
          isEdit={isEdit}
        />
      </div>
    </div>
  );
};