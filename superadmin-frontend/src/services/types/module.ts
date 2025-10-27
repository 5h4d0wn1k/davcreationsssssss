export interface Module {
  id: string;
  name: string;
  parentId?: string;
  toolTip?: string;
  description?: string;
  urlSlug: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  parent?: Module;
  children?: Module[];
}

export interface CreateModuleData {
  name: string;
  parentId?: string;
  toolTip?: string;
  description?: string;
  urlSlug: string;
}

export interface UpdateModuleData {
  name?: string;
  parentId?: string;
  toolTip?: string;
  description?: string;
  urlSlug?: string;
  isActive?: boolean;
}

export interface ModuleFilters {
  isActive?: boolean;
  parentId?: string;
  search?: string;
  urlSlug?: string;
  page?: number;
  limit?: number;
}

export interface ModuleListResponse {
  modules: Module[];
}

export interface HierarchicalModuleListResponse {
  modules: Module[];
}

export interface ModuleDetailResponse {
  module: Module;
}