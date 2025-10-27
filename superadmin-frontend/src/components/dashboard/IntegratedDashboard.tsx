"use client";
import React, { useState } from "react";
import UserList from "../users/UserList";
import ModuleList from "../modules/ModuleList";
import PermissionMatrix from "../permissions/PermissionMatrix";
import { ActivityFeed } from "./ActivityFeed";
import { User } from "../../services/types/user";
import { Module } from "../../services/types/module";

interface IntegratedDashboardProps {
  userRole: string;
}

export const IntegratedDashboard: React.FC<IntegratedDashboardProps> = ({
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "modules", label: "Modules", icon: "📁" },
    { id: "permissions", label: "Permissions", icon: "🔐" },
    { id: "activity", label: "Activity Log", icon: "📋" },
    { id: "settings", label: "System Settings", icon: "⚙️" },
  ];

  const handleUserView = (user: User) => {
    // Could open a modal or navigate to user details
    console.log("View user:", user);
  };

  const handleUserEdit = (user: User) => {
    // Could open an edit modal or navigate to edit page
    console.log("Edit user:", user);
  };

  const handleCreateUser = () => {
    // Could open a create user modal or navigate to create page
    console.log("Create new user");
  };

  const handleModuleView = (module: Module) => {
    console.log("View module:", module);
  };

  const handleModuleEdit = (module: Module) => {
    console.log("Edit module:", module);
  };

  const handleCreateModule = () => {
    console.log("Create new module");
  };

  const handleUserSelect = (user: User) => {
    console.log("Selected user for permissions:", user);
  };

  const handleModuleSelect = (module: Module) => {
    console.log("Selected module for permissions:", module);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
                System Overview
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Welcome to the integrated administrative dashboard. Use the tabs above to manage different aspects of your system.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">Users</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Manage user accounts, roles, and permissions</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h3 className="font-medium text-green-800 dark:text-green-200">Modules</h3>
                  <p className="text-sm text-green-600 dark:text-green-300">Configure system modules and access controls</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h3 className="font-medium text-purple-800 dark:text-purple-200">Permissions</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Assign and manage user permissions</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h3 className="font-medium text-orange-800 dark:text-orange-200">Activity Log</h3>
                  <p className="text-sm text-orange-600 dark:text-orange-300">Monitor system activities and audit trails</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h3 className="font-medium text-red-800 dark:text-red-200">Settings</h3>
                  <p className="text-sm text-red-600 dark:text-red-300">Configure system-wide settings</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="space-y-6">
            <UserList
              onViewUser={handleUserView}
              onEditUser={handleUserEdit}
              onCreateUser={handleCreateUser}
            />
          </div>
        );

      case "modules":
        return (
          <div className="space-y-6">
            <ModuleList
              onViewModule={handleModuleView}
              onEditModule={handleModuleEdit}
              onCreateModule={handleCreateModule}
            />
          </div>
        );

      case "permissions":
        return (
          <div className="space-y-6">
            <PermissionMatrix
              onUserSelect={handleUserSelect}
              onModuleSelect={handleModuleSelect}
            />
          </div>
        );

      case "activity":
        return (
          <div className="space-y-6">
            <ActivityFeed userRole={userRole} initialLimit={50} />
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
                System Settings
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Configure system-wide settings and preferences.
              </p>

              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
                    General Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        System Name
                      </label>
                      <input
                        type="text"
                        defaultValue="SuperAdmin System"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Language
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
                    Security Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white/90">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Require 2FA for all admin accounts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white/90">Session Timeout</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Automatically log out inactive users</p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="480">8 hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};