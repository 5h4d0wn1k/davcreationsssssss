"use client";

import React, { useState } from "react";
import PermissionMatrix from "../../../components/permissions/PermissionMatrix";
import RolePermissions from "../../../components/permissions/RolePermissions";
import UserModuleList from "../../../components/permissions/UserModuleList";
import BulkAssignForm from "../../../components/permissions/BulkAssignForm";
import { User } from "../../../services/types/auth";
import RoleGuard from "../../../components/layout/RoleGuard";
import Button from "../../../components/ui/button/Button";

type ViewMode = "matrix" | "roles" | "user-modules" | "bulk-assign";

const PermissionsPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <PermissionsPageContent />
    </RoleGuard>
  );
};

const PermissionsPageContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setViewMode("user-modules");
  };

  const handleBack = () => {
    setViewMode("matrix");
    setSelectedUser(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permissions Management
          </h1>
          <Button onClick={() => setViewMode("bulk-assign")} variant="outline">
            Bulk Assign
          </Button>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode("matrix")}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === "matrix"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Permission Matrix
          </button>
          <button
            onClick={() => setViewMode("roles")}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === "roles"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Role Permissions
          </button>
          <button
            onClick={() => setViewMode("bulk-assign")}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === "bulk-assign"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Bulk Assign
          </button>
        </div>
      </div>

      {viewMode === "user-modules" && selectedUser ? (
        <UserModuleList
          user={selectedUser}
          onBack={handleBack}
        />
      ) : viewMode === "roles" ? (
        <RolePermissions onBack={handleBack} />
      ) : viewMode === "bulk-assign" ? (
        <BulkAssignForm onBack={handleBack} />
      ) : (
        <PermissionMatrix
          onUserSelect={handleUserSelect}
          onModuleSelect={() => {}}
        />
      )}
    </div>
  );
};

export default PermissionsPage;


