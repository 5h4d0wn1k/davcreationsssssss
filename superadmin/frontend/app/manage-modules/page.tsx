'use client';

import React, { useState, useEffect } from 'react';
import { moduleApi, Module, CreateModuleRequest, UpdateModuleRequest, handleApiError } from '../../lib/api';
import { useAuth } from '../../components/AuthProvider';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Alert } from '../../components/FormError';

interface ModuleWithChildren extends Module {
  children?: ModuleWithChildren[];
}

export default function ManageModulesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [modules, setModules] = useState<ModuleWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deactivatingModule, setDeactivatingModule] = useState<Module | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateModuleRequest>({
    module_name: '',
    parent_id: undefined,
    url_slug: '',
    tool_tip: '',
    short_description: '',
    is_active: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.userType === 'superadmin' || user?.userType === 'admin';

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchModules();
    }
  }, [isAuthenticated, isLoading]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await moduleApi.getAllModules();
      const hierarchicalModules = buildHierarchy(data);
      setModules(hierarchicalModules);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (modules: Module[]): ModuleWithChildren[] => {
    const moduleMap = new Map<number, ModuleWithChildren>();
    const roots: ModuleWithChildren[] = [];

    // Create map of all modules
    modules.forEach(module => {
      moduleMap.set(module.module_id, { ...module, children: [] });
    });

    // Build hierarchy
    modules.forEach(module => {
      const moduleWithChildren = moduleMap.get(module.module_id)!;
      if (module.parent_id && module.parent_id !== 0) {
        const parent = moduleMap.get(module.parent_id);
        if (parent) {
          parent.children!.push(moduleWithChildren);
        } else {
          roots.push(moduleWithChildren);
        }
      } else {
        roots.push(moduleWithChildren);
      }
    });

    return roots;
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setFormLoading(true);
      setFormError(null);
      await moduleApi.createModule(formData);
      setSuccess('Module created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchModules();
    } catch (err: any) {
      setFormError(handleApiError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !isAdmin) return;

    try {
      setFormLoading(true);
      setFormError(null);
      const updateData: UpdateModuleRequest = {
        module_name: formData.module_name,
        parent_id: formData.parent_id,
        url_slug: formData.url_slug,
        tool_tip: formData.tool_tip,
        short_description: formData.short_description,
        is_active: formData.is_active,
      };
      await moduleApi.updateModule(editingModule.module_id, updateData);
      setSuccess('Module updated successfully');
      setEditingModule(null);
      resetForm();
      fetchModules();
    } catch (err: any) {
      setFormError(handleApiError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivateModule = async () => {
    if (!deactivatingModule || !isAdmin) return;

    try {
      setFormLoading(true);
      await moduleApi.deactivateModule(deactivatingModule.module_id);
      setSuccess('Module deactivated successfully');
      setDeactivatingModule(null);
      fetchModules();
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      module_name: '',
      parent_id: undefined,
      url_slug: '',
      tool_tip: '',
      short_description: '',
      is_active: true,
    });
    setFormError(null);
  };

  const openEditModal = (module: Module) => {
    setEditingModule(module);
    setFormData({
      module_name: module.module_name,
      parent_id: module.parent_id,
      url_slug: module.url_slug,
      tool_tip: module.tool_tip,
      short_description: module.short_description,
      is_active: module.is_active,
    });
  };

  const getStats = () => {
    const total = modules.reduce((acc, module) => acc + 1 + (module.children?.length || 0), 0);
    const active = modules.reduce((acc, module) => {
      const moduleActive = module.is_active ? 1 : 0;
      const childrenActive = module.children?.filter(child => child.is_active).length || 0;
      return acc + moduleActive + childrenActive;
    }, 0);
    const inactive = total - active;
    return { total, active, inactive };
  };

  const stats = getStats();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Show authentication required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
            <p className="text-muted">Please log in to access the module management system.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Manage Modules</h1>
          <p className="text-muted">Configure and manage system modules and their access controls</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert
            type="error"
            message={error}
            className="mb-6"
            onDismiss={() => setError(null)}
          />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            className="mb-6"
            onDismiss={() => setSuccess(null)}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-muted text-sm">Total Modules</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-muted text-sm">Active Modules</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                <p className="text-muted text-sm">Inactive Modules</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-muted text-sm">API Endpoints</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Modules List */}
          <div className="lg:col-span-2 glass rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">System Modules</h2>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Add Module
                </button>
              )}
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No modules found</h3>
                <p className="text-muted">Get started by creating your first module.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module) => (
                  <ModuleItem
                    key={module.module_id}
                    module={module}
                    onEdit={isAdmin ? openEditModal : undefined}
                    onDeactivate={isAdmin ? setDeactivatingModule : undefined}
                    level={0}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Module Status */}
          <div className="glass rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">Module Status</h2>

            <div className="space-y-4">
              {modules.slice(0, 6).map((module) => (
                <div key={module.module_id} className={`flex items-center justify-between p-4 rounded-lg ${
                  module.is_active ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      module.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-foreground truncate">
                      {module.module_name}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${
                    module.is_active ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {module.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Create Module Modal */}
        {showCreateModal && (
          <ModuleModal
            title="Create Module"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateModule}
            onClose={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            loading={formLoading}
            error={formError}
            modules={modules}
          />
        )}

        {/* Edit Module Modal */}
        {editingModule && (
          <ModuleModal
            title="Edit Module"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateModule}
            onClose={() => {
              setEditingModule(null);
              resetForm();
            }}
            loading={formLoading}
            error={formError}
            modules={modules}
            excludeId={editingModule.module_id}
          />
        )}

        {/* Deactivate Confirmation Modal */}
        {deactivatingModule && (
          <ConfirmationModal
            title="Deactivate Module"
            message={`Are you sure you want to deactivate "${deactivatingModule.module_name}"? This action can be reversed later.`}
            onConfirm={handleDeactivateModule}
            onCancel={() => setDeactivatingModule(null)}
            loading={formLoading}
          />
        )}
      </div>
    </div>
  );
}

// Module Item Component
interface ModuleItemProps {
  module: ModuleWithChildren;
  onEdit?: (module: Module) => void;
  onDeactivate?: (module: Module) => void;
  level: number;
}

function ModuleItem({ module, onEdit, onDeactivate, level }: ModuleItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = module.children && module.children.length > 0;

  return (
    <div className={`${level > 0 ? 'ml-6' : ''}`}>
      <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
        module.is_active
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-red-500/5 border-red-500/20'
      }`}>
        <div className="flex items-center space-x-3 flex-1">
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted hover:text-foreground transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <div className={`w-3 h-3 rounded-full ${
            module.is_active ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{module.module_name}</h3>
            {module.short_description && (
              <p className="text-sm text-muted mt-1">{module.short_description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
            module.is_active
              ? 'bg-green-500/20 text-green-900'
              : 'bg-red-500/20 text-red-900'
          }`}>
            {module.is_active ? 'Active' : 'Inactive'}
          </span>

          {onEdit && (
            <button
              onClick={() => onEdit(module)}
              className="p-2 text-muted hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              title="Edit module"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {onDeactivate && module.is_active && (
            <button
              onClick={() => onDeactivate(module)}
              className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Deactivate module"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="mt-2 space-y-2">
          {module.children!.map((child) => (
            <ModuleItem
              key={child.module_id}
              module={child}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Module Modal Component
interface ModuleModalProps {
  title: string;
  formData: CreateModuleRequest;
  setFormData: (data: CreateModuleRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  modules: ModuleWithChildren[];
  excludeId?: number;
}

function ModuleModal({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  loading,
  error,
  modules,
  excludeId
}: ModuleModalProps) {
  const flattenModules = (modules: ModuleWithChildren[]): Module[] => {
    const result: Module[] = [];
    const traverse = (mods: ModuleWithChildren[]) => {
      mods.forEach(mod => {
        if (mod.module_id !== excludeId) {
          result.push(mod);
          if (mod.children) traverse(mod.children);
        }
      });
    };
    traverse(modules);
    return result;
  };

  const availableParents = flattenModules(modules);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Module Name *
            </label>
            <input
              type="text"
              value={formData.module_name}
              onChange={(e) => setFormData({ ...formData, module_name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Parent Module
            </label>
            <select
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({
                ...formData,
                parent_id: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">No Parent (Root Module)</option>
              {availableParents.map((module) => (
                <option key={module.module_id} value={module.module_id}>
                  {module.module_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              URL Slug *
            </label>
            <input
              type="text"
              value={formData.url_slug}
              onChange={(e) => setFormData({ ...formData, url_slug: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., user-management"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tool Tip
            </label>
            <input
              type="text"
              value={formData.tool_tip || ''}
              onChange={(e) => setFormData({ ...formData, tool_tip: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Brief tooltip text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Short Description
            </label>
            <textarea
              value={formData.short_description || ''}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={3}
              placeholder="Brief description of the module"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-sm text-foreground">
              Active
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-muted border border-border rounded-lg hover:bg-muted/50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : title.split(' ')[0]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Confirmation Modal Component
interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmationModal({ title, message, onConfirm, onCancel, loading }: ConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onCancel}
            className="text-muted hover:text-foreground transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-muted mb-6">{message}</p>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-muted border border-border rounded-lg hover:bg-muted/50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}