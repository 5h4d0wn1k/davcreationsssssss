"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import SkeletonLoader from "../common/SkeletonLoader";
import { userService } from "../../services/api/users";
import { User, UserFilters } from "../../services/types/user";
import UserActions from "./UserActions";
import UserFiltersComponent from "./UserFilters";

interface UserListProps {
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onCreateUser: () => void;
}

const UserList: React.FC<UserListProps> = ({
  onViewUser,
  onEditUser,
  onCreateUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<UserFilters>({});
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    try {
      const response: User[] = await userService.getUsers(currentFilters);
      setUsers(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
    fetchUsers(newFilters);
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      switch (action) {
        case "delete":
          await userService.deleteUser(userId);
          toast.success("User deleted successfully");
          fetchUsers();
          break;
        case "logout":
          await userService.logoutUser(userId);
          toast.success("User logged out successfully");
          fetchUsers();
          break;
        case "recover":
          await userService.recoverUser(userId);
          toast.success("User recovered successfully");
          fetchUsers();
          break;
        case "hardDelete":
          await userService.hardDeleteUser(userId);
          toast.success("User permanently deleted");
          fetchUsers();
          break;
      }
    } catch (err: unknown) {
      const errorResponse = err as { message?: string; error?: string; statusCode?: number };
      const errorMessage = errorResponse.message || `Failed to ${action} user`;
      toast.error(errorMessage);
      console.error(`User action "${action}" failed:`, {
        error: errorResponse.error || 'Unknown error',
        message: errorResponse.message,
        statusCode: errorResponse.statusCode,
        fullError: err
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={onCreateUser}>Create User</Button>
      </div>

      <UserFiltersComponent onFiltersChange={handleFiltersChange} />


      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    User
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Email
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Phone
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    User Type
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4">
                      <SkeletonLoader rows={5} showAvatar={true} />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200">
                            {user.picture ? (
                              <Image
                                src={user.picture}
                                alt={`${user.firstName} ${user.lastName}`}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                {user.firstName[0]}{user.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {user.address}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.phone}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {user.userType?.name || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={
                            user.isActive
                              ? "success"
                              : user.isDeleted
                              ? "error"
                              : "warning"
                          }
                        >
                          {user.isActive ? "Active" : user.isDeleted ? "Deleted" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <UserActions
                          user={user}
                          onView={() => onViewUser(user)}
                          onEdit={() => onEditUser(user)}
                          onAction={handleUserAction}
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

export default UserList;