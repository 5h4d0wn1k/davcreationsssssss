export interface UserType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface CreateUserTypeData {
  name: string;
}

export interface UpdateUserTypeData {
  name?: string;
  isActive?: boolean;
}

export interface UserTypeListResponse {
  userTypes: UserType[];
}

export interface UserTypeDetailResponse {
  userType: UserType;
}