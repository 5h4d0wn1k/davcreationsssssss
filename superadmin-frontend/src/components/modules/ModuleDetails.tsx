"use client";

import React from "react";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Module } from "../../services/types/module";
import { PencilIcon, ChevronLeftIcon as ArrowLeftIcon } from "../../icons";

interface ModuleDetailsProps {
  module: Module;
  onEdit: () => void;
  onBack: () => void;
}

const ModuleDetails: React.FC<ModuleDetailsProps> = ({ module, onEdit, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="p-2">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Module Details</h1>
        </div>
        <Button onClick={onEdit}>
          <PencilIcon className="w-4 h-4 mr-2" />
          Edit Module
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {module.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {module.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2">{module.urlSlug}</p>
              <Badge
                size="sm"
                color={module.isActive ? "success" : "error"}
              >
                {module.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Module Name
                </label>
                <p className="text-gray-900 dark:text-white">{module.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  URL Slug
                </label>
                <p className="text-gray-900 dark:text-white">{module.urlSlug}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Parent Module
                </label>
                <p className="text-gray-900 dark:text-white">
                  {module.parent?.name || "Root Module"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tool Tip
                </label>
                <p className="text-gray-900 dark:text-white">
                  {module.toolTip || "N/A"}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <p className="text-gray-900 dark:text-white">
                  {module.description || "No description provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Permissions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Child Modules
                </label>
                {module.children && module.children.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {module.children.map((child) => (
                      <Badge key={child.id} size="sm" color="info">
                        {child.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No child modules</p>
                )}
              </div>
            </div>
          </div>

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
                  color={module.isActive ? "success" : "error"}
                >
                  {module.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created At
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(module.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Updated At
                </label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(module.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetails;