"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFormik } from "formik";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import TextArea from "../form/input/TextArea";
import { Module, CreateModuleData, UpdateModuleData } from "../../services/types/module";
import { moduleService } from "../../services/api/modules";
import { moduleFormSchema } from "../../services/utils/validationSchemas";

interface ModuleFormProps {
  module?: Module;
  onSuccess: () => void;
  onCancel: () => void;
}

const ModuleForm: React.FC<ModuleFormProps> = ({ module, onSuccess, onCancel }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (values: {
    name: string;
    parentId: string;
    toolTip: string;
    description: string;
    urlSlug: string;
    isActive: boolean;
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (module) {
        await moduleService.updateModule(module.id, values as UpdateModuleData);
        setSuccess("Module updated successfully");
      } else {
        await moduleService.createModule(values as CreateModuleData);
        setSuccess("Module created successfully");
      }
      setTimeout(() => onSuccess(), 1500); // Delay to show success message
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to save module");
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      parentId: "",
      toolTip: "",
      description: "",
      urlSlug: "",
      isActive: true,
    },
    validationSchema: moduleFormSchema,
    onSubmit: handleSubmit,
  });

  const fetchModules = useCallback(async () => {
    try {
      const modules: Module[] = await moduleService.getModules();
      setModules(modules || []);
    } catch (err) {
      console.error("Failed to load modules", err);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    if (module) {
      formik.setValues({
        name: module.name,
        parentId: module.parentId || "",
        toolTip: module.toolTip || "",
        description: module.description || "",
        urlSlug: module.urlSlug,
        isActive: module.isActive,
      });
    }
  }, [module, formik]);


  const parentModuleOptions = [
    { value: "", label: "Root Module" },
    ...modules
      .filter((m) => m.id !== module?.id) // Exclude current module to prevent self-reference
      .map((m) => ({
        value: m.id,
        label: m.name,
      })),
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">
        {module ? "Edit Module" : "Create New Module"}
      </h2>

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

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Module Name *</Label>
              <Input
                id="name"
                type="text"
                {...formik.getFieldProps("name")}
                className={formik.touched.name && formik.errors.name ? "border-red-500" : ""}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="urlSlug">URL Slug *</Label>
              <Input
                id="urlSlug"
                type="text"
                {...formik.getFieldProps("urlSlug")}
                placeholder="e.g., user-management"
                className={formik.touched.urlSlug && formik.errors.urlSlug ? "border-red-500" : ""}
              />
              {formik.touched.urlSlug && formik.errors.urlSlug && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.urlSlug}</p>
              )}
            </div>
            <div>
              <Label htmlFor="parentId">Parent Module</Label>
              <Select
                options={parentModuleOptions}
                placeholder="Select parent module"
                onChange={(value) => formik.setFieldValue("parentId", value)}
                defaultValue={formik.values.parentId}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="toolTip">Tool Tip</Label>
              <Input
                id="toolTip"
                type="text"
                {...formik.getFieldProps("toolTip")}
                placeholder="Brief tooltip text"
                className={formik.touched.toolTip && formik.errors.toolTip ? "border-red-500" : ""}
              />
              {formik.touched.toolTip && formik.errors.toolTip && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.toolTip}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <TextArea
                {...formik.getFieldProps("description")}
                placeholder="Detailed description of the module"
                rows={3}
                className={formik.touched.description && formik.errors.description ? "border-red-500" : ""}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Status (for edit only) */}
        {module && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Status</h3>
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                {...formik.getFieldProps("isActive")}
                className="mr-2"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : module ? "Update Module" : "Create Module"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ModuleForm;