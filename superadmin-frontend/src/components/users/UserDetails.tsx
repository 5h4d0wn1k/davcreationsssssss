"use client";

import React from "react";
import Image from "next/image";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { User } from "../../services/types/user";
import { PencilIcon, ChevronLeftIcon as ArrowLeftIcon } from "../../icons";

interface UserDetailsProps {
  user: User;
  onEdit: () => void;
  onBack: () => void;
}

const UserDetails: React.FC<UserDetailsProps> = ({ user, onEdit, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="p-2">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>
        <Button onClick={onEdit}>
          <PencilIcon className="w-4 h-4 mr-2" />
          Edit User
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full bg-gray-200">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2">{user.email}</p>
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
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  First Name
                </label>
                <p className="text-gray-900 dark:text-white">{user.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Name
                </label>
                <p className="text-gray-900 dark:text-white">{user.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </label>
                <p className="text-gray-900 dark:text-white">{user.phone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Address
                </label>
                <p className="text-gray-900 dark:text-white">{user.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  User Type
                </label>
                <p className="text-gray-900 dark:text-white">
                  {user.userType?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Banking Information */}
          {(user.bankName || user.bankIfscCode || user.bankAccountNumber || user.bankAddress) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.bankName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Bank Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.bankName}</p>
                  </div>
                )}
                {user.bankIfscCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      IFSC Code
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.bankIfscCode}</p>
                  </div>
                )}
                {user.bankAccountNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Account Number
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.bankAccountNumber}</p>
                  </div>
                )}
                {user.bankAddress && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Bank Address
                    </label>
                    <p className="text-gray-900 dark:text-white">{user.bankAddress}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created At
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Updated At
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;