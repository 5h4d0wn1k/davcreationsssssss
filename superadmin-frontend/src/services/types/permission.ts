import { Module } from './module';

export interface UserAccess {
  id: string;
  moduleId: string;
  userId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  module?: Module;
}

export interface AssignModuleData {
  userId: string;
  moduleId: string;
}

export interface UnassignModuleData {
  userId: string;
  moduleId: string;
}

export interface BulkAssignModulesData {
  userId: string;
  moduleIds: string[];
}

export interface UserModulesResponse {
  modules: Module[];
  userAccess: UserAccess[];
}

export interface PermissionResponse {
  success: boolean;
  message: string;
}