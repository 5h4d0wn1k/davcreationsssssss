"use client";

import React, { useState } from "react";
import ModuleList from "../../../components/modules/ModuleList";
import ModuleForm from "../../../components/modules/ModuleForm";
import ModuleDetails from "../../../components/modules/ModuleDetails";
import ModuleTree from "../../../components/modules/ModuleTree";
import { Module } from "../../../services/types/module";
import RoleGuard from "../../../components/layout/RoleGuard";

type ViewMode = "list" | "create" | "edit" | "view";

const ModulesPage: React.FC = () => {
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <ModulesPageContent />
    </RoleGuard>
  );
};

const ModulesPageContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const handleViewModule = (module: Module) => {
    setSelectedModule(module);
    setViewMode("view");
  };

  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setViewMode("edit");
  };

  const handleCreateModule = () => {
    setSelectedModule(null);
    setViewMode("create");
  };

  const handleFormSuccess = () => {
    setViewMode("list");
    setSelectedModule(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedModule(null);
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedModule(null);
  };

  if (viewMode === "create") {
    return (
      <div className="p-6">
        <ModuleForm onSuccess={handleFormSuccess} onCancel={handleCancel} />
      </div>
    );
  }

  if (viewMode === "edit" && selectedModule) {
    return (
      <div className="p-6">
        <ModuleForm
          module={selectedModule}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (viewMode === "view" && selectedModule) {
    return (
      <div className="p-6">
        <ModuleDetails
          module={selectedModule}
          onEdit={() => handleEditModule(selectedModule)}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ModuleList
            onViewModule={handleViewModule}
            onEditModule={handleEditModule}
            onCreateModule={handleCreateModule}
          />
        </div>
        <div className="lg:col-span-1">
          <ModuleTree
            onModuleSelect={handleViewModule}
            selectedModuleId={selectedModule?.id}
          />
        </div>
      </div>
    </div>
  );
};

export default ModulesPage;