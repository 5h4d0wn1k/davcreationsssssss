"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { userTypeService } from "../../services/api/userTypes";
import { UserType } from "../../services/types/userType";
import { useAuth } from "../../contexts/AuthContext";
import UserTypeActions from "./UserTypeActions";
import { SearchIcon } from "../../icons";

interface UserTypeListProps {
  onViewUserType: (userType: UserType) => void;
  onEditUserType: (userType: UserType) => void;
  onCreateUserType: () => void;
}

const UserTypeList: React.FC<UserTypeListProps> = ({
  onViewUserType,
  onEditUserType,
  onCreateUserType,
}) => {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const { user: currentUser } = useAuth();

  // Role hierarchy for display
  const roleHierarchy = useMemo(() => ({
    superadmin: 4,
    admin: 3,
    manager: 2,
    user: 1,
  }), []);

  // Filtered and searched user types
  const filteredUserTypes = useMemo(() => {
    return userTypes
      .filter((userType) => {
        const matchesSearch = userType.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && userType.isActive) ||
          (statusFilter === "inactive" && !userType.isActive);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => (roleHierarchy[b.name.toLowerCase() as keyof typeof roleHierarchy] || 0) - (roleHierarchy[a.name.toLowerCase() as keyof typeof roleHierarchy] || 0));
  }, [userTypes, searchTerm, statusFilter, roleHierarchy]);

  const fetchUserTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: UserType[] = await userTypeService.getUserTypes();
      setUserTypes(response);
    } catch (err) {
      setError("Failed to load user types");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserTypes();
  }, [fetchUserTypes]);

  const handleUserTypeAction = async (action: string, userTypeId: string) => {
    try {
      setError(null);
      setSuccess(null);

      if (action === "delete") {
        await userTypeService.deleteUserType(userTypeId);
        setSuccess("User type deleted successfully");
        fetchUserTypes();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || `Failed to ${action} user type`);
      console.error(err);
    }
  };

  // Check if current user is superadmin
  const isSuperAdmin = currentUser?.userType?.name === "superadmin";

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. Only superadmin can manage user types.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Types</h1>
          <p className="text-gray-600 mt-1">
            Role Hierarchy: Superadmin → Admin → Manager → User
          </p>
        </div>
        <Button onClick={onCreateUserType}>Create User Type</Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search user types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button onClick={fetchUserTypes} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredUserTypes.length} of {userTypes.length} user types
        {searchTerm && ` matching "${searchTerm}"`}
        {statusFilter !== "all" && ` (${statusFilter})`}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
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
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
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
                    Name
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Hierarchy Level
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Created
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading user types...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUserTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-gray-500">
                        {userTypes.length === 0 ? "No user types found" : "No user types match your search criteria"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUserTypes.map((userType) => (
                      <TableRow key={userType.id}>
                        <TableCell className="px-5 py-4 text-start">
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {userType.name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {roleHierarchy[userType.name.toLowerCase() as keyof typeof roleHierarchy] || "N/A"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge
                            size="sm"
                            color={userType.isActive ? "success" : "error"}
                          >
                            {userType.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(userType.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <UserTypeActions
                            userType={userType}
                            onView={() => onViewUserType(userType)}
                            onEdit={() => onEditUserType(userType)}
                            onAction={handleUserTypeAction}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTypeList;