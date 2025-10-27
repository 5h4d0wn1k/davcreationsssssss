"use client";

import React, { useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import { ModuleFilters as ModuleFiltersType } from "../../services/types/module";

interface ModuleFiltersProps {
  onFiltersChange: (filters: ModuleFiltersType) => void;
}

const ModuleFilters: React.FC<ModuleFiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<ModuleFiltersType>({});

  const handleInputChange = (field: string, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDebouncedInputChange = (field: string, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    // Debounce the filter change to avoid too many API calls
    setTimeout(() => onFiltersChange(newFilters), 300);
  };

  const handleReset = () => {
    const resetFilters = {};
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search by Name
          </label>
          <Input
            type="text"
            placeholder="Search modules..."
            value={filters.search || ""}
            onChange={(e) => handleDebouncedInputChange("search", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL Slug
          </label>
          <Input
            type="text"
            placeholder="Search by URL slug..."
            value={filters.urlSlug || ""}
            onChange={(e) => handleDebouncedInputChange("urlSlug", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <Select
            options={statusOptions}
            placeholder="Select status"
            onChange={(value) => handleInputChange("isActive", value === "true" ? true : value === "false" ? false : undefined)}
            defaultValue={filters.isActive === true ? "true" : filters.isActive === false ? "false" : ""}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Parent Module ID
          </label>
          <Input
            type="text"
            placeholder="Parent module ID"
            value={filters.parentId || ""}
            onChange={(e) => handleInputChange("parentId", e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={handleReset} className="w-full">
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModuleFilters;