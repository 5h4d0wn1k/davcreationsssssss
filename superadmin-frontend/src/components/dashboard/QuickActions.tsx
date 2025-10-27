"use client";
import React from "react";
import Button from "../ui/button/Button";
import { PlusIcon, UserIcon, BoxIcon, LockIcon, PencilIcon, EyeIcon, CloseIcon } from "@/icons";

interface QuickActionsProps {
  userRole: string;
  onAction?: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ userRole, onAction }) => {
  const renderActionsByRole = () => {
    switch (userRole.toLowerCase()) {
      case 'superadmin':
        return (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Button
                onClick={() => onAction?.('create-user')}
                className="flex items-center gap-2 justify-center"
                size="sm"
              >
                <PlusIcon className="w-4 h-4" />
                Create User
              </Button>
              <Button
                onClick={() => onAction?.('create-module')}
                className="flex items-center gap-2 justify-center"
                variant="outline"
                size="sm"
              >
                <BoxIcon className="w-4 h-4" />
                Create Module
              </Button>
              <Button
                onClick={() => onAction?.('manage-permissions')}
                className="flex items-center gap-2 justify-center"
                variant="outline"
                size="sm"
              >
                <LockIcon className="w-4 h-4" />
                Manage Permissions
              </Button>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={() => onAction?.('create-user')}
                className="flex items-center gap-2 justify-center"
                size="sm"
              >
                <PlusIcon className="w-4 h-4" />
                Create User
              </Button>
              <Button
                onClick={() => onAction?.('assign-permissions')}
                className="flex items-center gap-2 justify-center"
                variant="outline"
                size="sm"
              >
                <LockIcon className="w-4 h-4" />
                Assign Permissions
              </Button>
            </div>
          </div>
        );

      case 'manager':
        return (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                onClick={() => onAction?.('view-users')}
                className="flex items-center gap-2 justify-center"
                size="sm"
              >
                <EyeIcon className="w-4 h-4" />
                View Users
              </Button>
              <Button
                onClick={() => onAction?.('logout-users')}
                className="flex items-center gap-2 justify-center"
                variant="outline"
                size="sm"
              >
                <CloseIcon className="w-4 h-4" />
                Logout Users
              </Button>
              <Button
                onClick={() => onAction?.('manage-users')}
                className="flex items-center gap-2 justify-center"
                variant="outline"
                size="sm"
              >
                <UserIcon className="w-4 h-4" />
                Manage Users
              </Button>
            </div>
          </div>
        );

      case 'user':
        return (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                onClick={() => onAction?.('update-profile')}
                className="flex items-center gap-2 justify-center"
                size="sm"
              >
                <PencilIcon className="w-4 h-4" />
                Update Profile
              </Button>
              <Button
                onClick={() => onAction?.('view-modules')}
                className="flex items-center gap-2 justify-center"
                variant="outline"
                size="sm"
              >
                <BoxIcon className="w-4 h-4" />
                View Modules
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderActionsByRole();
};