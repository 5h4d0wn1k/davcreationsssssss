import { User } from './auth';
import { PaginationParams } from './common';

export type { User };

export interface CreateUserData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  userTypeId: string;
  bankName?: string;
  bankIfscCode?: string;
  bankAccountNumber?: string;
  bankAddress?: string;
  picture?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  userTypeId?: string;
  bankName?: string;
  bankIfscCode?: string;
  bankAccountNumber?: string;
  bankAddress?: string;
  picture?: string;
  isActive?: boolean;
}

export interface ChangeUserTypeData {
  userTypeId: string;
}

export interface UserFilters extends PaginationParams {
  userTypeId?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  search?: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserDetailResponse {
  user: User;
}