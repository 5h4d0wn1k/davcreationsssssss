import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';
import {
  LoginCredentials,
  RegisterData,
  GoogleLoginData,
  ForgotPasswordData,
  SendOtpData,
  VerifyOtpData,
  AuthResponse,
  LogoutResponse,
  User,
} from '../types/auth';

export const authService = {
  // User registration with OTP verification
  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('Frontend: Registering user with data:', data);
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    console.log('Frontend: Registration response:', response);
    return response.data!;
  },

  // User login with email, password, and OTP
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('authService: Starting login with credentials:', credentials);
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    console.log('authService: Login API response:', response);
    console.log('authService: Response data:', response.data);
    console.log('authService: Response data user:', response.data?.user);
    console.log('authService: Response data session:', response.data?.session);
    return response.data!;
  },

  // Logout current user
  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>(
      API_ENDPOINTS.AUTH.LOGOUT
    );
    return response.data!;
  },

  // Logout from all sessions
  async logoutAll(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>(
      API_ENDPOINTS.AUTH.LOGOUT_ALL
    );
    return response.data!;
  },

  // Forgot password with OTP
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );
    return response.data!;
  },

  // Send OTP to email
  async sendOtp(data: SendOtpData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.SEND_OTP,
      data
    );
    return response.data!;
  },

  // Verify OTP code
  async verifyOtp(data: VerifyOtpData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      data
    );
    return response.data!;
  },

  // Google OAuth login
  async googleLogin(data: GoogleLoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
      data
    );
    return response.data!;
  },

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    console.log('Frontend: Getting current user data');
    const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.USER_DATA);
    console.log('Frontend: Current user response:', response);
    return response.data!;
  },

  // Refresh JWT token
  async refreshToken(): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await apiClient.post<{ accessToken: string; refreshToken?: string }>(
      '/user/refresh-token'
    );
    return response.data!;
  },
};