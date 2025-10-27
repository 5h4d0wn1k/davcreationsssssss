import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';
import {
  UserType,
  CreateUserTypeData,
  UpdateUserTypeData,
  UserTypeDetailResponse,
} from '../types/userType';

export const userTypeService = {
  // Get all user types (superadmin access)
  async getUserTypes(): Promise<UserType[]> {
    const response = await apiClient.get<UserType[]>(
      API_ENDPOINTS.USER_TYPES.LIST
    );
    return response.data!;
  },

  // Get user type by ID (superadmin access)
  async getUserTypeById(id: string): Promise<UserTypeDetailResponse> {
    const response = await apiClient.get<UserTypeDetailResponse>(
      API_ENDPOINTS.USER_TYPES.GET_BY_ID(id)
    );
    return response.data!;
  },

  // Create new user type (superadmin access)
  async createUserType(data: CreateUserTypeData): Promise<UserType> {
    const response = await apiClient.post<UserType>(
      API_ENDPOINTS.USER_TYPES.CREATE,
      data
    );
    return response.data!;
  },

  // Update user type (superadmin access)
  async updateUserType(
    id: string,
    data: UpdateUserTypeData
  ): Promise<UserType> {
    const response = await apiClient.put<UserType>(
      API_ENDPOINTS.USER_TYPES.UPDATE(id),
      data
    );
    return response.data!;
  },

  // Delete user type (superadmin access)
  async deleteUserType(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.USER_TYPES.DELETE(id)
    );
    return response.data!;
  },
};