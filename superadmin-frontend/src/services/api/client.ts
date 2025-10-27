import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { redirect } from 'next/navigation';
import { API_BASE_URL } from '../utils/constants';
import { handleApiError, handleApiResponse } from '../utils/apiHelpers';
import { ApiResponse } from '../types/common';
import { logger } from '../utils/logger';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<{ accessToken: string; refreshToken?: string }> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies for session management
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authorization header if JWT token exists
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for cache busting
        config.headers['X-Request-Time'] = Date.now().toString();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Extract and store new tokens if provided
        const newAccessToken = response.headers['x-access-token'];
        const newRefreshToken = response.headers['x-refresh-token'];

        if (newAccessToken) {
          this.setAccessToken(newAccessToken);
        }
        if (newRefreshToken) {
          this.setRefreshToken(newRefreshToken);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            // Retry the original request with new token
            const token = this.getAccessToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            // Trigger logout through auth context if available
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:logout'));
              redirect('/signin');
            }
            return Promise.reject(refreshError);
          }
        }

        const handledError = handleApiError(error);
        return Promise.reject(handledError);
      }
    );
  }

  private async refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string }> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.client.post('/user/refresh-token', {
      refreshToken: this.getRefreshToken(),
    });

    try {
      const response = await this.refreshPromise;
      const { accessToken, refreshToken } = response;

      if (accessToken) {
        this.setAccessToken(accessToken);
      }
      if (refreshToken) {
        this.setRefreshToken(refreshToken);
      }

      return { accessToken, refreshToken };
    } finally {
      this.refreshPromise = null;
    }
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('refreshToken', token);
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  public async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, config);
      return handleApiResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  public async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      logger.debug('API Client: Making POST request to:', url);
      const response = await this.client.post(url, data, config);
      logger.debug('API Client: POST response received');
      return handleApiResponse<T>(response);
    } catch (error) {
      logger.debug('API Client: POST error');
      throw error;
    }
  }

  public async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config);
      return handleApiResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(url, data, config);
      return handleApiResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  public async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config);
      return handleApiResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  // Method to update base URL if needed
  public setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }

  // Method to add authorization header if needed
  public setAuthToken(token: string): void {
    this.setAccessToken(token);
  }

  // Method to remove authorization header
  public removeAuthToken(): void {
    this.clearTokens();
  }

  // Enhanced token management methods
  public setTokens(accessToken: string, refreshToken?: string): void {
    this.setAccessToken(accessToken);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  public getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: this.getAccessToken(),
      refreshToken: this.getRefreshToken(),
    };
  }

  public clearAllTokens(): void {
    this.clearTokens();
  }

  // Get current access token
  public getCurrentAccessToken(): string | null {
    return this.getAccessToken();
  }

  // Get the underlying axios instance for advanced usage
  public getInstance(): AxiosInstance {
    return this.client;
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;