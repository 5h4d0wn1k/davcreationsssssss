import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';
import { createQueryString } from '../utils/apiHelpers';
import {
  User,
  CreateUserData,
  UpdateUserData,
  ChangeUserTypeData,
  UserFilters,
} from '../types/user';

export const userService = {
  // Get all users (admin/manager access)
  async getUsers(filters?: UserFilters): Promise<User[]> {
    const queryString = createQueryString(filters as Record<string, unknown> || {});
    const response = await apiClient.get<User[]>(
      `${API_ENDPOINTS.USERS.LIST}${queryString}`
    );
    return response.data!;
  },

  // Get users with pagination (admin/manager access)
  async getUsersPaginated(filters?: UserFilters): Promise<User[]> {
    const queryString = createQueryString(filters as Record<string, unknown> || {});
    const response = await apiClient.get<User[]>(
      `${API_ENDPOINTS.USERS.LIST}${queryString}`
    );
    return response.data!;
  },

  // Get all users for admin (admin/manager access)
  async getAllUsers(filters?: UserFilters): Promise<User[]> {
    const queryString = createQueryString(filters as Record<string, unknown> || {});
    const response = await apiClient.get<User[]>(
      `${API_ENDPOINTS.USERS.ADMIN_LIST}${queryString}`
    );
    return response.data!;
  },

  // Get user by ID (admin/manager access)
  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(
      API_ENDPOINTS.USERS.GET_BY_ID(id)
    );
    return response.data!;
  },

  // Create new user (admin access)
  async createUser(data: CreateUserData): Promise<User> {
    const response = await apiClient.post<User>(
      API_ENDPOINTS.USERS.CREATE,
      data
    );
    return response.data!;
  },

  // Update user (admin access)
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await apiClient.put<User>(
      API_ENDPOINTS.USERS.UPDATE(id),
      data
    );
    return response.data!;
  },

  // Soft delete user (admin access)
  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.USERS.DELETE(id)
    );
    return response.data!;
  },

  // Hard delete user (admin access)
  async hardDeleteUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.USERS.HARD_DELETE(id)
    );
    return response.data!;
  },

  // Recover deleted user (superadmin access)
  async recoverUser(id: string): Promise<User> {
    const response = await apiClient.patch<User>(
      API_ENDPOINTS.USERS.RECOVER(id)
    );
    return response.data!;
  },

  // Change user type/role (admin/manager access)
  async changeUserType(
    id: string,
    data: ChangeUserTypeData
  ): Promise<User> {
    const response = await apiClient.patch<User>(
      API_ENDPOINTS.USERS.CHANGE_USERTYPE(id),
      data
    );
    return response.data!;
  },

  // Logout specific user (admin/manager access)
  async logoutUser(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.USERS.LOGOUT_USER(id)
    );
    return response.data!;
  },
};