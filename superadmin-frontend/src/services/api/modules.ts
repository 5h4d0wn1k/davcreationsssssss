import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';
import { createQueryString } from '../utils/apiHelpers';
import {
  Module,
  CreateModuleData,
  UpdateModuleData,
  ModuleFilters,
} from '../types/module';

export const moduleService = {
  // Get all modules (admin/manager access)
  async getModules(filters?: ModuleFilters): Promise<Module[]> {
    const queryString = createQueryString(filters as Record<string, unknown> || {});
    const response = await apiClient.get<Module[]>(
      `${API_ENDPOINTS.MODULES.LIST}${queryString}`
    );
    return response.data!;
  },

  // Get module by ID (admin/manager access)
  async getModuleById(id: string): Promise<Module> {
    const response = await apiClient.get<Module>(
      API_ENDPOINTS.MODULES.GET_BY_ID(id)
    );
    return response.data!;
  },

  // Create new module (admin access)
  async createModule(data: CreateModuleData): Promise<Module> {
    const response = await apiClient.post<Module>(
      API_ENDPOINTS.MODULES.CREATE,
      data
    );
    return response.data!;
  },

  // Update module (admin access)
  async updateModule(
    id: string,
    data: UpdateModuleData
  ): Promise<Module> {
    const response = await apiClient.put<Module>(
      API_ENDPOINTS.MODULES.UPDATE(id),
      data
    );
    return response.data!;
  },

  // Deactivate module (admin access)
  async deactivateModule(id: string): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>(
      API_ENDPOINTS.MODULES.DEACTIVATE(id)
    );
    return response.data!;
  },

  // Hard delete module (admin access)
  async deleteModule(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.MODULES.DELETE(id)
    );
    return response.data!;
  },

  // Bulk update modules (admin access)
  async bulkUpdateModules(moduleIds: string[], action: 'activate' | 'deactivate' | 'delete'): Promise<{ message: string; affectedModules: number }> {
    const response = await apiClient.post<{ message: string; affectedModules: number }>(
      `${API_ENDPOINTS.MODULES.LIST}/bulk-update`,
      { moduleIds, action }
    );
    return response.data!;
  },
};