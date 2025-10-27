"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "../ui/button/Button";
import MultiSelect from "../form/MultiSelect";
import { userService } from "../../services/api/users";
import { moduleService } from "../../services/api/modules";
import { permissionService } from "../../services/api/permissions";
import { User } from "../../services/types/user";
import { Module } from "../../services/types/module";

interface BulkAssignFormProps {
  onBack: () => void;
}

const BulkAssignForm: React.FC<BulkAssignFormProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setFetchingData(true);
    setError(null);
    try {
      const [usersResponse, modulesResponse] = await Promise.all([
        userService.getUsers(), // Get all users
        moduleService.getModules(), // Get all modules
      ]);

      setUsers(usersResponse);
      setModules(modulesResponse);
    } catch (err) {
      setError("Failed to load users and modules");
      console.error(err);
    } finally {
      setFetchingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0 || selectedModuleIds.length === 0) {
      setError("Please select at least one user and one module");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Process bulk assignment for each user
      const promises = selectedUserIds.map(userId =>
        permissionService.bulkAssignModules({
          userId,
          moduleIds: selectedModuleIds,
        })
      );

      await Promise.all(promises);

      setSuccess(`Successfully assigned ${selectedModuleIds.length} modules to ${selectedUserIds.length} users`);
      setSelectedUserIds([]);
      setSelectedModuleIds([]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to bulk assign permissions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const userOptions = users.map(user => ({
    value: user.id,
    text: `${user.firstName} ${user.lastName} (${user.email})`,
    selected: selectedUserIds.includes(user.id),
  }));

  const moduleOptions = modules.map(module => ({
    value: module.id,
    text: `${module.name}${module.toolTip ? ` - ${module.toolTip}` : ''}`,
    selected: selectedModuleIds.includes(module.id),
  }));

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading form data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Bulk Assign Permissions</h2>
        <Button onClick={onBack} variant="outline">
          Back to Matrix
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Bulk Assignment Information
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Select multiple users and modules to assign permissions in bulk</li>
            <li>• Existing permissions will not be affected - only new assignments will be made</li>
            <li>• This operation cannot be undone, so review your selections carefully</li>
            <li>• Use the Permission Matrix for individual user-module assignments</li>
          </ul>
        </div>

        <div>
          <MultiSelect
            label="Select Users"
            options={userOptions}
            defaultSelected={selectedUserIds}
            onChange={setSelectedUserIds}
          />
          <p className="text-sm text-gray-500 mt-1">
            Selected {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div>
          <MultiSelect
            label="Select Modules to Assign"
            options={moduleOptions}
            defaultSelected={selectedModuleIds}
            onChange={setSelectedModuleIds}
          />
          <p className="text-sm text-gray-500 mt-1">
            Selected {selectedModuleIds.length} module{selectedModuleIds.length !== 1 ? 's' : ''}
          </p>
        </div>


        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Assignment Summary
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Ready to assign <strong>{selectedModuleIds.length}</strong> module{selectedModuleIds.length !== 1 ? 's' : ''} to <strong>{selectedUserIds.length}</strong> user{selectedUserIds.length !== 1 ? 's' : ''}.
            This will create {selectedUserIds.length * selectedModuleIds.length} new permission assignments.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedUserIds([]);
              setSelectedModuleIds([]);
              setError(null);
              setSuccess(null);
            }}
          >
            Clear Selection
          </Button>
          <Button
            type="submit"
            disabled={loading || selectedUserIds.length === 0 || selectedModuleIds.length === 0}
          >
            {loading ? "Assigning..." : "Bulk Assign Permissions"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BulkAssignForm;