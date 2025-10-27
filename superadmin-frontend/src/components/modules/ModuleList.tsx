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
import ConfirmationDialog from "../common/ConfirmationDialog";
import SkeletonLoader from "../common/SkeletonLoader";
import Pagination from "../tables/Pagination";
import { moduleService } from "../../services/api/modules";
import { Module, ModuleFilters } from "../../services/types/module";
import ModuleActions from "./ModuleActions";
import ModuleFiltersComponent from "./ModuleFilters";

interface ModuleListProps {
  onViewModule: (module: Module) => void;
  onEditModule: (module: Module) => void;
  onCreateModule: () => void;
}

const ModuleList: React.FC<ModuleListProps> = ({
  onViewModule,
  onEditModule,
  onCreateModule,
}) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [filters, setFilters] = useState<ModuleFilters>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "danger",
  });

  const fetchModules = useCallback(async (currentFilters = filters, page = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await moduleService.getModules({
        ...currentFilters,
        page,
        limit: itemsPerPage,
      });
      setModules(response);
      setTotalItems(response.length);
      setTotalPages(Math.ceil(response.length / itemsPerPage));
    } catch (err) {
      setError("Failed to load modules");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleFiltersChange = (newFilters: ModuleFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    fetchModules(newFilters, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchModules(filters, page);
  };

  const handleModuleAction = async (action: string, moduleId: string) => {
    if (action === "delete") {
      setConfirmationDialog({
        isOpen: true,
        title: "Delete Module",
        message: "Are you sure you want to permanently delete this module? This action cannot be undone.",
        onConfirm: async () => {
          try {
            setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
            setError(null);
            setSuccess(null);
            await moduleService.deleteModule(moduleId);
            setSuccess("Module deleted successfully");
            fetchModules();
          } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Failed to delete module");
            console.error(err);
          }
        },
        variant: "danger",
      });
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      switch (action) {
        case "deactivate":
          await moduleService.deactivateModule(moduleId);
          setSuccess("Module deactivated successfully");
          fetchModules();
          break;
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || `Failed to ${action} module`);
      console.error(err);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedModules.length === 0) {
      setError("Please select modules to perform bulk action");
      return;
    }

    if (action === 'delete') {
      setConfirmationDialog({
        isOpen: true,
        title: "Delete Multiple Modules",
        message: `Are you sure you want to permanently delete ${selectedModules.length} module(s)? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
            setError(null);
            setSuccess(null);
            await moduleService.bulkUpdateModules(selectedModules, action);
            setSuccess(`${selectedModules.length} modules deleted successfully`);
            setSelectedModules([]);
            fetchModules();
          } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Failed to delete modules");
            console.error(err);
          }
        },
        variant: "danger",
      });
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await moduleService.bulkUpdateModules(selectedModules, action);
      setSuccess(`${selectedModules.length} modules ${action}d successfully`);
      setSelectedModules([]);
      fetchModules();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || `Failed to ${action} modules`);
      console.error(err);
    }
  };

  const handleSelectModule = (moduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedModules(prev => [...prev, moduleId]);
    } else {
      setSelectedModules(prev => prev.filter(id => id !== moduleId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedModules(modules.map(m => m.id));
    } else {
      setSelectedModules([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Modules</h1>
        <div className="flex gap-2">
          {selectedModules.length > 0 && (
            <>
              <Button variant="outline" onClick={() => handleBulkAction('activate')}>
                Activate ({selectedModules.length})
              </Button>
              <Button variant="outline" onClick={() => handleBulkAction('deactivate')}>
                Deactivate ({selectedModules.length})
              </Button>
              <Button variant="outline" onClick={() => handleBulkAction('delete')} className="text-red-600">
                Delete ({selectedModules.length})
              </Button>
            </>
          )}
          <Button onClick={onCreateModule}>Create Module</Button>
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}

      </div>
      <ModuleFiltersComponent onFiltersChange={handleFiltersChange} />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 ml-4"
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
            className="text-green-700 hover:text-green-900 ml-4"
          >
            ×
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={selectedModules.length === modules.length && modules.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </TableCell>
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
                    Description
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
                    <TableCell colSpan={7} className="py-8">
                      <SkeletonLoader rows={5} showAvatar={false} />
                    </TableCell>
                  </TableRow>
                ) : modules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No modules found
                    </TableCell>
                  </TableRow>
                ) : (
                  modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(module.id)}
                          onChange={(e) => handleSelectModule(module.id, e.target.checked)}
                          className="rounded"
                        />
                      </TableCell>
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
                        {module.description || "N/A"}
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
                        <ModuleActions
                          module={module}
                          onView={() => onViewModule(module)}
                          onEdit={() => onEditModule(module)}
                          onDelete={() => handleModuleAction("delete", module.id)}
                          onAction={handleModuleAction}
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

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        variant={confirmationDialog.variant}
      />
    </div>
  );
};

export default ModuleList;