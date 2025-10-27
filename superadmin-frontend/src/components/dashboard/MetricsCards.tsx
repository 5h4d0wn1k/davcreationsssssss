"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, GroupIcon, UserIcon, BoxIcon, LockIcon } from "@/icons";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
        {icon}
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value}
          </h4>
        </div>
        {change !== undefined && changeType && (
          <Badge color={changeType === 'increase' ? 'success' : 'error'}>
            {changeType === 'increase' ? <ArrowUpIcon /> : <ArrowDownIcon className="text-error-500" />}
            {Math.abs(change)}%
          </Badge>
        )}
      </div>
    </div>
  );
};

interface MetricsCardsProps {
  userRole: string;
  metrics: {
    totalUsers?: number;
    activeUsers?: number;
    deletedUsers?: number;
    totalModules?: number;
    activeModules?: number;
    totalUserTypes?: number;
    usersUnderManagement?: number;
    assignedModules?: number;
    personalModules?: number;
  };
  isLoading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ userRole, metrics, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-xl dark:bg-gray-700 mb-5"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
                <div className="h-6 bg-gray-200 rounded dark:bg-gray-700"></div>
                <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  const renderMetricsByRole = () => {
    switch (userRole.toLowerCase()) {
      case 'superadmin':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            <MetricCard
              title="Total Users"
              value={metrics.totalUsers || 0}
              change={11.01}
              changeType="increase"
              icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="Active Users"
              value={metrics.activeUsers || 0}
              change={8.5}
              changeType="increase"
              icon={<UserIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="Deleted Users"
              value={metrics.deletedUsers || 0}
              change={-2.3}
              changeType="decrease"
              icon={<UserIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="Total Modules"
              value={metrics.totalModules || 0}
              change={5.2}
              changeType="increase"
              icon={<BoxIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="Active Modules"
              value={metrics.activeModules || 0}
              change={3.1}
              changeType="increase"
              icon={<BoxIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="User Types"
              value={metrics.totalUserTypes || 0}
              icon={<LockIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
          </div>
        );

      case 'admin':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            <MetricCard
              title="Users Under Management"
              value={metrics.usersUnderManagement || 0}
              change={7.8}
              changeType="increase"
              icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="Active Users"
              value={metrics.activeUsers || 0}
              change={4.2}
              changeType="increase"
              icon={<UserIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="Assigned Modules"
              value={metrics.assignedModules || 0}
              icon={<BoxIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
          </div>
        );

      case 'manager':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            <MetricCard
              title="Users Under Management"
              value={metrics.usersUnderManagement || 0}
              change={6.3}
              changeType="increase"
              icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="Active Users"
              value={metrics.activeUsers || 0}
              change={3.7}
              changeType="increase"
              icon={<UserIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
          </div>
        );

      case 'user':
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            <MetricCard
              title="Assigned Modules"
              value={metrics.personalModules || 0}
              icon={<BoxIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
            <MetricCard
              title="Profile Status"
              value="Active"
              icon={<UserIcon className="text-gray-800 size-6 dark:text-white/90" />}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return renderMetricsByRole();
};