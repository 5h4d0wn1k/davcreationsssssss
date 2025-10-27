"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import { UserFilters as UserFiltersType } from "../../services/types/user";
import { userTypeService } from "../../services/api/userTypes";
import { UserType } from "../../services/types/userType";

interface UserFiltersProps {
  onFiltersChange: (filters: UserFiltersType) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<UserFiltersType>({});
  const [userTypes, setUserTypes] = useState<UserType[]>([]);

  const debouncedSearch = useDebounce(filters.search || "", 500);

  const fetchUserTypes = useCallback(async () => {
    try {
      const response = await userTypeService.getUserTypes();
      setUserTypes(response || []);
    } catch (err) {
      console.error("Failed to load user types", err);
    }
  }, []);

  useEffect(() => {
    fetchUserTypes();
  }, [fetchUserTypes]);

  // Apply debounced search
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearch };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    }
  }, [debouncedSearch, filters, onFiltersChange]);

  const handleFilterChange = (key: keyof UserFiltersType, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Apply immediately for non-search filters
    if (key !== "search") {
      onFiltersChange(newFilters);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Force immediate search for manual search button click
    onFiltersChange({ ...filters, search: filters.search });
  };

  const clearFilters = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const userTypeOptions = userTypes.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  const deletedOptions = [
    { value: "", label: "All Users" },
    { value: "false", label: "Active Users" },
    { value: "true", label: "Deleted Users" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search by name or email"
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Type
            </label>
            <Select
              options={[
                { value: "", label: "All Types" },
                ...userTypeOptions,
              ]}
              placeholder="Select user type"
              onChange={(value) => handleFilterChange("userTypeId", value || undefined)}
              defaultValue={filters.userTypeId || ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <Select
              options={statusOptions}
              placeholder="Select status"
              onChange={(value) => handleFilterChange("isActive", value ? value === "true" : undefined)}
              defaultValue={filters.isActive !== undefined ? filters.isActive.toString() : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User State
            </label>
            <Select
              options={deletedOptions}
              placeholder="Select state"
              onChange={(value) => handleFilterChange("isDeleted", value ? value === "true" : undefined)}
              defaultValue={filters.isDeleted !== undefined ? filters.isDeleted.toString() : ""}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">
            Search
          </Button>
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserFilters;