"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ModuleDetails from "../../../../components/modules/ModuleDetails";
import { moduleService } from "../../../../services/api/modules";
import { Module } from "../../../../services/types/module";

const ModuleDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const moduleId = params.id as string;

  const fetchModule = useCallback(async () => {
    try {
      setLoading(true);
      const response = await moduleService.getModuleById(moduleId);
      setModule(response);
    } catch (err) {
      setError("Failed to load module details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  const handleEdit = () => {
    router.push(`/modules/${moduleId}/edit`);
  };

  const handleBack = () => {
    router.push("/modules");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading module details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-6">
        <div className="text-center">Module not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ModuleDetails module={module} onEdit={handleEdit} onBack={handleBack} />
    </div>
  );
};

export default ModuleDetailsPage;