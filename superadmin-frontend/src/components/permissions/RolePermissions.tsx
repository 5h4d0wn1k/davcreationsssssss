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
import { userService } from "../../services/api/users";
import { moduleService } from "../../services/api/modules";
import { permissionService } from "../../services/api/permissions";
import { User } from "../../services/types/user";
import { Module } from "../../services/types/module";

interface RolePermissionsProps {
  onBack: () => void;
}

const RolePermissions: React.FC<RolePermissionsProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [roleModules, setRoleModules] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

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

      // Group users by role and fetch their permissions
      const roleGroups: Record<string, User[]> = {};
      usersResponse.forEach(user => {
        const roleName = user.userType?.name || "No Role";
        if (!roleGroups[roleName]) {
          roleGroups[roleName] = [];
        }
        roleGroups[roleName].push(user);
      });

      // For each role, collect common modules
      const roleModulesMap: Record<string, string[]> = {};
      for (const [roleName, roleUsers] of Object.entries(roleGroups)) {
        const moduleCounts: Record<string, number> = {};

        // Count how many users in this role have each module
        for (const user of roleUsers) {
          try {
            const response: Module[] = await permissionService.getUserModules(user.id);
            response.forEach((module: Module) => {
              moduleCounts[module.id] = (moduleCounts[module.id] || 0) + 1;
            });
          } catch (err) {
            console.error(`Failed to fetch modules for user ${user.id}:`, err);
          }
        }

        // Include modules that are assigned to all users in the role
        roleModulesMap[roleName] = Object.keys(moduleCounts).filter(
          moduleId => moduleCounts[moduleId] === roleUsers.length
        );
      }

      setRoleModules(roleModulesMap);

      // Set default selected role
      const roleNames = Object.keys(roleModulesMap);
      if (roleNames.length > 0 && !selectedRole) {
        setSelectedRole(roleNames[0]);
      }
    } catch (err) {
      setError("Failed to load role permissions data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  const hasRolePermission = (moduleId: string): boolean => {
    return roleModules[selectedRole]?.includes(moduleId) || false;
  };

  const getRoleUsers = () => {
    return users.filter(user => user.userType?.name === selectedRole);
  };

  const getModuleStats = (moduleId: string) => {
    const roleUsers = getRoleUsers();
    let assignedCount = 0;

    roleUsers.forEach(() => {
      // This is a simplified check - in a real implementation,
      // you'd want to cache or fetch this data
      if (hasRolePermission(moduleId)) {
        assignedCount++;
      }
    });

    return {
      assigned: assignedCount,
      total: roleUsers.length,
      percentage: roleUsers.length > 0 ? Math.round((assignedCount / roleUsers.length) * 100) : 0
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading role permissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={() => setError(null)}
          className="text-red-700 hover:text-red-900 font-bold"
        >
          ×
        </button>
      </div>
    );
  }

  const roleNames = Object.keys(roleModules);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Role-Based Permissions</h2>
        <Button onClick={onBack} variant="outline">
          Back to Matrix
        </Button>
      </div>


      <div className="flex space-x-4">
        {roleNames.map((roleName) => (
          <button
            key={roleName}
            onClick={() => handleRoleChange(roleName)}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedRole === roleName
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {roleName} ({getRoleUsers().length})
          </button>
        ))}
      </div>

      {selectedRole && (
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
                      Role Coverage
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {modules.map((module) => {
                    const stats = getModuleStats(module.id);
                    const hasPermission = hasRolePermission(module.id);

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
                          <div className="flex items-center space-x-2">
                            <Badge
                              size="sm"
                              color={hasPermission ? "success" : "warning"}
                            >
                              {hasPermission ? "Assigned" : "Not Assigned"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {stats.assigned}/{stats.total} ({stats.percentage}%)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissions;