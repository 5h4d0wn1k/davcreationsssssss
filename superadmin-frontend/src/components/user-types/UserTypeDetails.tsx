"use client";

import React from "react";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { UserType } from "../../services/types/userType";
import { useAuth } from "../../contexts/AuthContext";

interface UserTypeDetailsProps {
  userType: UserType;
  onEdit: () => void;
  onBack: () => void;
}

const UserTypeDetails: React.FC<UserTypeDetailsProps> = ({
  userType,
  onEdit,
  onBack,
}) => {
  const { user: currentUser } = useAuth();

  // Role hierarchy for display
  const roleHierarchy = {
    superadmin: 4,
    admin: 3,
    manager: 2,
    user: 1,
  };

  // Check if current user is superadmin
  const isSuperAdmin = currentUser?.userType?.name === "superadmin";

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. Only superadmin can view user type details.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Type Details</h1>
        <div className="flex gap-2">
          <Button onClick={onEdit}>Edit User Type</Button>
          <Button variant="outline" onClick={onBack}>
            Back to List
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {userType.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hierarchy Level
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {roleHierarchy[userType.name.toLowerCase() as keyof typeof roleHierarchy] || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      size="sm"
                      color={userType.isActive ? "success" : "error"}
                    >
                      {userType.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Timestamps</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Created At
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(userType.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Updated At
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(userType.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Role Hierarchy</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                This user type fits into the following hierarchy:
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <span className={`px-2 py-1 rounded ${userType.name.toLowerCase() === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                  Superadmin
                </span>
                <span className="text-gray-400">→</span>
                <span className={`px-2 py-1 rounded ${userType.name.toLowerCase() === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  Admin
                </span>
                <span className="text-gray-400">→</span>
                <span className={`px-2 py-1 rounded ${userType.name.toLowerCase() === 'manager' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  Manager
                </span>
                <span className="text-gray-400">→</span>
                <span className={`px-2 py-1 rounded ${userType.name.toLowerCase() === 'user' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                  User
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTypeDetails;