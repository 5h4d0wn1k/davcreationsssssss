"use client";

import React, { useState, useEffect } from "react";
import { Module } from "../../services/types/module";
import { moduleService } from "../../services/api/modules";
import Badge from "../ui/badge/Badge";

interface ModuleTreeProps {
  onModuleSelect?: (module: Module) => void;
  selectedModuleId?: string;
}

const ModuleTree: React.FC<ModuleTreeProps> = ({ onModuleSelect, selectedModuleId }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await moduleService.getModules();
        const treeModules = buildTree(response || []);
        setModules(treeModules);
      } catch (err) {
        setError("Failed to load modules");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const buildTree = (modules: Module[]): Module[] => {
    const moduleMap = new Map<string, Module>();
    const roots: Module[] = [];

    // Create a map of all modules
    modules.forEach((module) => {
      moduleMap.set(module.id, { ...module, children: [] });
    });

    // Build the tree
    modules.forEach((module) => {
      const moduleWithChildren = moduleMap.get(module.id)!;
      if (module.parentId) {
        const parent = moduleMap.get(module.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(moduleWithChildren);
        }
      } else {
        roots.push(moduleWithChildren);
      }
    });

    return roots;
  };

  const renderModuleNode = (module: Module, level: number = 0) => {
    const isSelected = selectedModuleId === module.id;
    const hasChildren = module.children && module.children.length > 0;

    return (
      <div key={module.id}>
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
            isSelected ? "bg-blue-100 dark:bg-blue-900" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => onModuleSelect?.(module)}
        >
          <div className="flex-1 flex items-center gap-2">
            <span className="font-medium">{module.name}</span>
            <Badge
              size="sm"
              color={module.isActive ? "success" : "error"}
            >
              {module.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {hasChildren && (
            <span className="text-gray-500 text-sm">
              ({module.children!.length})
            </span>
          )}
        </div>
        {hasChildren && (
          <div>
            {module.children!.map((child) => renderModuleNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading module tree...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold mb-4">Module Hierarchy</h3>
      {modules.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No modules found</p>
      ) : (
        <div className="space-y-1">
          {modules.map((module) => renderModuleNode(module))}
        </div>
      )}
    </div>
  );
};

export default ModuleTree;