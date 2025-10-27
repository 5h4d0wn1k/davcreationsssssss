export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  userTypeId: string;
  bankName?: string;
  bankIfscCode?: string;
  bankAccountNumber?: string;
  bankAddress?: string;
  isActive: boolean;
  picture?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  userType?: UserType;
}

export interface UserType {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Session {
  id: string;
  userId: string;
  expiry: number;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  otp: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  otp: string;
}

export interface GoogleLoginData {
  token: string;
}

export interface ForgotPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface SendOtpData {
  email: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface LogoutResponse {
  message: string;
}