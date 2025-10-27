"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { permissionService } from "../../services/api/permissions";
import { User } from "../../services/types/user";
import { Module } from "../../services/types/module";
import { UserAccess } from "../../services/types/permission";
import PermissionActions from "./PermissionActions";

interface UserModuleListProps {
  user: User;
  onBack: () => void;
}

const UserModuleList: React.FC<UserModuleListProps> = ({ user, onBack }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUserModules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const modules: Module[] = await permissionService.getUserModules(user.id);
      setModules(modules);
      // Note: userAccess is no longer part of the response, so we need to handle this differently
      // For now, we'll set it to an empty array or fetch it separately if needed
      setUserAccess([]);
    } catch (err) {
      setError("Failed to load user modules");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchUserModules();
  }, [fetchUserModules]);

  const handlePermissionToggle = async (userId: string, moduleId: string, hasPermission: boolean) => {
    try {
      setError(null);
      setSuccess(null);

      if (hasPermission) {
        await permissionService.unassignModule({ userId, moduleId });
        setSuccess("Permission removed successfully");
      } else {
        await permissionService.assignModule({ userId, moduleId });
        setSuccess("Permission assigned successfully");
      }

      // Refresh the data
      await fetchUserModules();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to update permission");
      console.error(err);
    }
  };


  const getUserAccessInfo = (moduleId: string) => {
    return userAccess.find(access => access.moduleId === moduleId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading user modules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Modules for {user.firstName} {user.lastName}</h2>
          <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Back to Matrix
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-700 hover:text-green-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Module Name
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    URL Slug
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Parent Module
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Assigned Date
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {modules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No modules assigned to this user
                    </TableCell>
                  </TableRow>
                ) : (
                  modules.map((module) => {
                    const accessInfo = getUserAccessInfo(module.id);
                    return (
                      <TableRow key={module.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {module.name}
                            </span>
                            {module.toolTip && (
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                {module.toolTip}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {module.urlSlug}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {module.parent?.name || "Root"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge
                            size="sm"
                            color={module.isActive ? "success" : "error"}
                          >
                            {module.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {accessInfo ? new Date(accessInfo.createdAt).toLocaleDateString() : "N/A"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <PermissionActions
                            userId={user.id}
                            moduleId={module.id}
                            hasPermission={true}
                            onToggle={handlePermissionToggle}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModuleList;