import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';
import {
  AssignModuleData,
  UnassignModuleData,
  BulkAssignModulesData,
} from '../types/permission';
import { Module } from '../types/module';

export const permissionService = {
  // Get user's modules (admin/manager access)
  async getUserModules(userId: string): Promise<Module[]> {
    const response = await apiClient.get<Module[]>(
      API_ENDPOINTS.PERMISSIONS.USER_MODULES(userId)
    );
    return response.data!;
  },

  // Assign module to user (admin access)
  async assignModule(data: AssignModuleData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PERMISSIONS.ASSIGN_MODULE,
      data
    );
    return response.data!;
  },

  // Unassign module from user (admin access)
  async unassignModule(data: UnassignModuleData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PERMISSIONS.UNASSIGN_MODULE,
      data
    );
    return response.data!;
  },

  // Bulk assign modules to user (admin access)
  async bulkAssignModules(data: BulkAssignModulesData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      API_ENDPOINTS.PERMISSIONS.BULK_ASSIGN_MODULES,
      data
    );
    return response.data!;
  },
};