"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Button from "../ui/button/Button";
import { userService } from "../../services/api/users";
import { moduleService } from "../../services/api/modules";
import { permissionService } from "../../services/api/permissions";
import { User } from "../../services/types/user";
import { Module } from "../../services/types/module";
import PermissionActions from "./PermissionActions";

interface PermissionMatrixProps {
  onUserSelect: (user: User) => void;
  onModuleSelect: (module: Module) => void;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  onUserSelect,
  onModuleSelect,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [userModules, setUserModules] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, modulesResponse] = await Promise.all([
        userService.getUsers(),
        moduleService.getModules(),
      ]);

      setUsers(usersResponse);
      setModules(modulesResponse);

      // Fetch permissions for all users
      const userModulesPromises = usersResponse.map(async (user) => {
        try {
          const modules: Module[] = await permissionService.getUserModules(user.id);
          return { userId: user.id, moduleIds: modules.map(m => m.id) };
        } catch (err) {
          console.error(`Failed to fetch modules for user ${user.id}:`, err);
          return { userId: user.id, moduleIds: [] };
        }
      });

      const userModulesResults = await Promise.all(userModulesPromises);
      const userModulesMap: Record<string, string[]> = {};
      userModulesResults.forEach(({ userId, moduleIds }) => {
        userModulesMap[userId] = moduleIds;
      });
      setUserModules(userModulesMap);
    } catch (err) {
      setError("Failed to load permissions data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      // Update local state
      setUserModules(prev => ({
        ...prev,
        [userId]: hasPermission
          ? prev[userId]?.filter(id => id !== moduleId) || []
          : [...(prev[userId] || []), moduleId]
      }));

      // Auto-dismiss success message after 2 seconds
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to update permission");
      console.error(err);
    }
  };

  const hasPermission = (userId: string, moduleId: string): boolean => {
    return userModules[userId]?.includes(moduleId) || false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading permissions matrix...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Permission Matrix</h2>
        <Button onClick={fetchData} variant="outline">
          Refresh
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
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-900 z-10">
                    User / Module
                  </TableCell>
                  {modules.map((module) => (
                    <TableCell
                      key={module.id}
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 min-w-[120px]"
                    >
                      <div className="cursor-pointer hover:text-blue-600" onClick={() => onModuleSelect(module)}>
                        {module.name}
                      </div>
                      {module.toolTip && (
                        <div className="text-xs text-gray-400 mt-1">{module.toolTip}</div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start sticky left-0 bg-white dark:bg-gray-900 z-10">
                      <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded" onClick={() => onUserSelect(user)}>
                        <div className="w-8 h-8 overflow-hidden rounded-full bg-gray-200">
                          {user.picture ? (
                            <Image
                              src={user.picture}
                              alt={`${user.firstName} ${user.lastName}`}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    {modules.map((module) => {
                      const permission = hasPermission(user.id, module.id);
                      return (
                        <TableCell key={module.id} className="px-4 py-3 text-center">
                          <PermissionActions
                            userId={user.id}
                            moduleId={module.id}
                            hasPermission={permission}
                            onToggle={handlePermissionToggle}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;