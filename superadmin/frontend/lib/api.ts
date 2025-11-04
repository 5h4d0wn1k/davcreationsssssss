// API Service Layer for Superadmin Frontend
// Handles all backend API interactions with proper TypeScript types, error handling, and session management

// Base API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// API Response Types
export interface ApiResponse<T = unknown> {
  message?: string;
  error?: string;
  data?: T;
}

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
  isRetryable?: boolean;
  isNetworkError?: boolean;
  isRateLimited?: boolean;
}

// Network and Retry Configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Base delay in ms
  retryDelayMultiplier: 2,
  timeout: 30000, // 30 seconds
};

const RATE_LIMIT_CONFIG = {
  retryAfterHeader: "retry-after",
  defaultRetryDelay: 60000, // 1 minute
};

// Network status tracking
let isOnline = true;
let networkCheckInterval: NodeJS.Timeout | null = null;

// Network status utilities
export const getNetworkStatus = () => isOnline;

export const setNetworkStatus = (status: boolean) => {
  isOnline = status;
};

// Initialize network monitoring
if (typeof window !== "undefined") {
  // Check initial online status
  isOnline = navigator.onLine;

  // Listen for online/offline events
  window.addEventListener("online", () => {
    console.log("Network: Online");
    setNetworkStatus(true);
  });

  window.addEventListener("offline", () => {
    console.log("Network: Offline");
    setNetworkStatus(false);
  });

  // Periodic network check
  networkCheckInterval = setInterval(() => {
    const wasOnline = isOnline;
    isOnline = navigator.onLine;

    if (wasOnline !== isOnline) {
      console.log(`Network status changed: ${isOnline ? "Online" : "Offline"}`);
    }
  }, 30000); // Check every 30 seconds
}

// User Types
export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  user_type_id: number;
  is_active: boolean;
  created_date?: string;
  last_updated_date?: string;
}

export interface UserWithLoginStatus extends User {
  userType: string;
  isLoggedIn: boolean;
}

export interface UserDetails {
  first_name: string;
  last_name: string;
  email: string;
  picture?: string;
  userType: string;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  user_password: string;
  address?: string;
  user_type_id: number;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  user_password?: string;
  address?: string;
  user_type_id?: number;
  is_active?: boolean;
}

// Module Types
export interface Module {
  module_id: number;
  module_name: string;
  parent_id: number;
  url_slug: string;
  tool_tip: string;
  short_description: string;
  is_active: boolean;
  created_date?: string;
  last_updated_date?: string;
}

export interface CreateModuleRequest {
  module_name: string;
  parent_id?: number;
  url_slug: string;
  tool_tip?: string;
  short_description?: string;
  is_active?: boolean;
}

export interface UpdateModuleRequest {
  module_name?: string;
  parent_id?: number;
  url_slug?: string;
  tool_tip?: string;
  short_description?: string;
  is_active?: boolean;
}

// User Type Types
export interface UserType {
  user_type_id: number;
  user_type_name: string;
  user_type_value: number;
  is_active: boolean;
  created_date?: string;
  last_updated_date?: string;
}

export interface CreateUserTypeRequest {
  user_type_name: string;
  user_type_value: number;
}

export interface UpdateUserTypeRequest {
  user_type_name?: string;
  user_type_value?: number;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  user_password: string;
  otp: string;
}

export interface SendOtpRequest {
  email: string;
  user_password: string; // Required for login OTP - backend validates credentials
}

export interface SendForgotPasswordOtpRequest {
  email: string; // For forgot password flow, we only need email (no password required)
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
  newPassword: string;
  otp: string;
}

// User Access Types
export interface UserAccess {
  user_access_id: number;
  user_id: number;
  module_id: number;
  created_by: number;
  is_active: boolean;
  created_date: string;
  last_updated_date: string;
}

// Activity Log Types
export interface ActivityLog {
  activity_log_id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_date: string;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AssignModuleRequest {
  user_id: number;
  module_id: number;
}

export interface UnassignModuleRequest {
  user_id: number;
  module_id: number;
}

// Utility functions for retry logic
const isRetryableError = (error: ApiError): boolean => {
  // Retry on network errors, 5xx server errors, and specific 4xx errors
  return (
    error.isNetworkError ||
    error.status >= 500 ||
    error.status === 408 || // Request Timeout
    error.status === 429 || // Too Many Requests
    error.status === 502 || // Bad Gateway
    error.status === 503 || // Service Unavailable
    error.status === 504 // Gateway Timeout
  );
};

const getRetryDelay = (attempt: number): number => {
  return (
    RETRY_CONFIG.retryDelay *
    Math.pow(RETRY_CONFIG.retryDelayMultiplier, attempt)
  );
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Base API Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Check network status before making request
    if (!isOnline) {
      const networkError: ApiError = {
        message:
          "No internet connection. Please check your network and try again.",
        status: 0,
        isNetworkError: true,
        isRetryable: true,
        details: { offline: true },
      };
      throw networkError;
    }

    const config: RequestInit = {
      credentials: "include", // Important for cookie handling
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      RETRY_CONFIG.timeout
    );

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response types
      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");
      let data: unknown;

      // Handle empty body responses (204, or empty content-length)
      if (response.status === 204 || contentLength === "0") {
        data = undefined;
      } else if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        data = text ? JSON.parse(text) : undefined;
      } else {
        data = await response.text();
      }

      // ⚠️ CRITICAL QUIRK: Backend returns 200 with "Loged out!" for expired sessions
      // We need to detect this and treat it as 401 Unauthorized
      if (response.ok && response.status === 200) {
        const responseData =
          typeof data === "object" && data !== null
            ? (data as Record<string, unknown>)
            : {};
        const message = (responseData.message as string) || "";

        // Check for session expiry message (note the typo "Loged" in backend)
        if (
          message === "Loged out!" ||
          message.toLowerCase().includes("logged out")
        ) {
          const sessionExpiredError: ApiError = {
            message: "Your session has expired. Please log in again.",
            status: 401,
            details: { sessionExpired: true, originalMessage: message },
            isRetryable: false,
          };
          throw sessionExpiredError;
        }
      }

      if (!response.ok) {
        const responseData =
          typeof data === "object" && data !== null
            ? (data as Record<string, unknown>)
            : {};
        const error: ApiError = {
          message:
            (responseData.error as string) ||
            (responseData.message as string) ||
            "An error occurred",
          status: response.status,
          details: data,
          isRateLimited: response.status === 429,
          isRetryable: isRetryableError({
            message: "",
            status: response.status,
            isNetworkError: false,
          } as ApiError),
        };

        // Handle rate limiting with retry-after header
        if (response.status === 429) {
          const retryAfter = response.headers.get(
            RATE_LIMIT_CONFIG.retryAfterHeader
          );
          if (retryAfter) {
            const delay = parseInt(retryAfter) * 1000; // Convert to milliseconds
            const existingDetails =
              typeof error.details === "object" && error.details !== null
                ? (error.details as Record<string, unknown>)
                : {};
            error.details = { ...existingDetails, retryAfter: delay };
          }
        }

        throw error;
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && "status" in error) {
        // API Error - check if retryable
        const apiError = error as ApiError;
        if (apiError.isRetryable && retryCount < RETRY_CONFIG.maxRetries) {
          console.log(
            `API Error (retryable): ${
              apiError.message
            }. Retrying in ${getRetryDelay(retryCount)}ms...`
          );

          // Wait before retrying
          await sleep(getRetryDelay(retryCount));

          // Retry the request
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        throw apiError;
      }

      // Handle AbortError (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        const timeoutError: ApiError = {
          message: "Request timed out. Please try again.",
          status: 408,
          isNetworkError: true,
          isRetryable: true,
          details: { timeout: true },
        };

        if (retryCount < RETRY_CONFIG.maxRetries) {
          console.log(
            `Request timeout. Retrying in ${getRetryDelay(retryCount)}ms...`
          );
          await sleep(getRetryDelay(retryCount));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        throw timeoutError;
      }

      // Network or other errors
      const networkError: ApiError = {
        message:
          error instanceof Error ? error.message : "Network error occurred",
        status: 0,
        isNetworkError: true,
        isRetryable: true,
        details: error,
      };

      // Retry network errors
      if (retryCount < RETRY_CONFIG.maxRetries) {
        console.log(
          `Network error: ${networkError.message}. Retrying in ${getRetryDelay(
            retryCount
          )}ms...`
        );
        await sleep(getRetryDelay(retryCount));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw networkError;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Authentication API Functions
export const authApi = {
  login: async (data: LoginRequest): Promise<{ message: string }> => {
    try {
      return await apiClient.post("/user/login", data);
    } catch (error) {
      // ⚠️ CRITICAL QUIRK: Backend returns 409 for invalid credentials (not standard 401)
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        (error as ApiError).status === 409
      ) {
        throw {
          ...(error as ApiError),
          message:
            "Invalid email, password, or verification code. Please check your credentials and try again.",
        };
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    return apiClient.post("/user/logout");
  },

  logoutAll: async (): Promise<void> => {
    return apiClient.post("/user/logout/all");
  },

  getUserDetails: async (): Promise<UserDetails> => {
    return apiClient.get("/user/data");
  },

  sendOtp: async (data: SendOtpRequest): Promise<{ message: string }> => {
    return apiClient.post("/user/send-otp", data);
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<{ message: string }> => {
    return apiClient.post("/user/verify-otp", data);
  },

  forgotPassword: async (
    data: ForgotPasswordRequest
  ): Promise<{ message: string }> => {
    return apiClient.post("/user/forgot/password", data);
  },
};

// User Management API Functions
export const userApi = {
  getAllUsers: async (): Promise<UserWithLoginStatus[]> => {
    return apiClient.get("/users");
  },

  getAllAdminUsers: async (): Promise<User[]> => {
    return apiClient.get("/admin/users/all");
  },

  getUserById: async (id: number): Promise<User> => {
    return apiClient.get(`/admin/users/${id}`);
  },

  createUser: async (
    data: CreateUserRequest
  ): Promise<{ message: string; user: User }> => {
    return apiClient.post("/admin/users", data);
  },

  updateUser: async (
    id: number,
    data: UpdateUserRequest
  ): Promise<{ message: string; user: User }> => {
    // ⚠️ CRITICAL: Backend expects user_type_id as STRING for PUT endpoint (Zod schema quirk)
    const requestData = {
      ...data,
      ...(data.user_type_id !== undefined && {
        user_type_id: String(data.user_type_id),
      }),
    };
    return apiClient.put(`/admin/users/${id}`, requestData);
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete(`/admin/delete/user/${id}`);
  },

  hardDeleteUser: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete(`/admin/hard/delete/user/${id}`);
  },

  recoverUser: async (id: number): Promise<void> => {
    return apiClient.patch(`/admin/recover/user/${id}`);
  },

  logoutUserByAdmin: async (id: number): Promise<void> => {
    return apiClient.delete(`/admin/logout/user/${id}`);
  },

  changeUserRole: async (
    id: number,
    data: { user_type_name: string }
  ): Promise<void> => {
    return apiClient.patch(`/admin/change/usertype/user/${id}`, data);
  },
};

// Module Management API Functions
export const moduleApi = {
  getAllModules: async (): Promise<Module[]> => {
    return apiClient.get("/admin/modules");
  },

  getModuleById: async (id: number): Promise<Module> => {
    return apiClient.get(`/admin/modules/${id}`);
  },

  createModule: async (
    data: CreateModuleRequest
  ): Promise<{ message: string; module: Module }> => {
    return apiClient.post("/admin/modules", data);
  },

  updateModule: async (
    id: number,
    data: UpdateModuleRequest
  ): Promise<{ message: string; module: Module }> => {
    return apiClient.put(`/admin/modules/${id}`, data);
  },

  deactivateModule: async (id: number): Promise<{ message: string }> => {
    return apiClient.patch(`/admin/modules/${id}/deactivate`);
  },
};

// Roles & Permissions API Functions
export const rolesApi = {
  getUserModules: async (userId: number): Promise<Module[]> => {
    return apiClient.get(`/admin/users/${userId}/modules`);
  },

  assignModuleToUser: async (
    data: AssignModuleRequest
  ): Promise<{ message: string; access: UserAccess }> => {
    return apiClient.post("/admin/assign/module", data);
  },

  unassignModuleFromUser: async (
    data: UnassignModuleRequest
  ): Promise<{ message: string }> => {
    return apiClient.post("/admin/unassign/module", data);
  },

  // User Type Management
  getAllUserTypes: async (): Promise<UserType[]> => {
    return apiClient.get("/admin/user-types");
  },

  getUserTypeById: async (id: number): Promise<UserType> => {
    return apiClient.get(`/admin/user-types/${id}`);
  },

  createUserType: async (
    data: CreateUserTypeRequest
  ): Promise<{ message: string; userType: UserType }> => {
    // ⚠️ CRITICAL: Backend returns 'id' instead of 'user_type_id' (inconsistency)
    const response = await apiClient.post<{
      message: string;
      userType: { id: number; user_type_name: string; user_type_value: number };
    }>("/admin/user-types", data);
    return {
      message: response.message,
      userType: {
        user_type_id: response.userType.id, // Map id -> user_type_id
        user_type_name: response.userType.user_type_name,
        user_type_value: response.userType.user_type_value,
        is_active: true, // Default to true for new user types
      },
    };
  },

  updateUserType: async (
    id: number,
    data: UpdateUserTypeRequest
  ): Promise<{ message: string; userType: UserType }> => {
    return apiClient.put(`/admin/user-types/${id}`, data);
  },

  deleteUserType: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete(`/admin/user-types/${id}`);
  },
};

// Activity Logs API Functions
export const activityLogApi = {
  getAllActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    user_id?: number;
    entity_type?: string;
    action?: string;
  }): Promise<{ logs: ActivityLog[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.user_id)
      queryParams.append("user_id", params.user_id.toString());
    if (params?.entity_type)
      queryParams.append("entity_type", params.entity_type);
    if (params?.action) queryParams.append("action", params.action);

    const queryString = queryParams.toString();
    return apiClient.get(
      `/activity-logs${queryString ? `?${queryString}` : ""}`
    );
  },

  getUserActivityLogs: async (
    userId: number,
    limit?: number
  ): Promise<ActivityLog[]> => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit.toString());
    const queryString = queryParams.toString();
    return apiClient.get(
      `/activity-logs/user/${userId}${queryString ? `?${queryString}` : ""}`
    );
  },

  getActivityLogById: async (id: number): Promise<ActivityLog> => {
    return apiClient.get(`/activity-logs/${id}`);
  },

  deleteActivityLog: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete(`/activity-logs/${id}`);
  },
};

// Type guard for ApiError
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "status" in error &&
    typeof (error as any).message === "string" &&
    typeof (error as any).status === "number"
  );
};

// Enhanced error handling utility
export const handleApiError = (error: ApiError): string => {
  // Handle network errors
  if (error.isNetworkError) {
    if (!isOnline) {
      return "No internet connection. Please check your network and try again.";
    }
    return "Network error. Please check your connection and try again.";
  }

  // Handle rate limiting
  if (error.isRateLimited) {
    const details = error.details as Record<string, unknown> | undefined;
    const retryAfter = details?.retryAfter as number | undefined;
    if (retryAfter) {
      const minutes = Math.ceil(retryAfter / 60000);
      return `Too many requests. Please wait ${minutes} minute${
        minutes > 1 ? "s" : ""
      } before trying again.`;
    }
    return "Too many requests. Please wait a moment before trying again.";
  }

  // Handle specific HTTP status codes
  switch (error.status) {
    case 400:
      // Check if this is a Zod validation error with details field
      const details = error.details as Record<string, unknown> | undefined;
      if (details?.details && typeof details.details === "string") {
        return `Validation failed: ${details.details}`;
      }
      return (
        error.message ||
        "Invalid request. Please check your input and try again."
      );
    case 401:
      // Check if this is a session expiry
      if (details?.sessionExpired) {
        return "Your session has expired. Please log in again.";
      }
      return error.message || "Authentication required. Please log in again.";
    case 403:
      return (
        error.message || "You do not have permission to perform this action."
      );
    case 404:
      return error.message || "The requested resource was not found.";
    case 408:
      return "Request timed out. Please try again.";
    case 409:
      // ⚠️ Backend uses 409 for invalid login credentials (quirk)
      return (
        error.message ||
        "Invalid credentials or verification code. Please try again."
      );
    case 422:
      return error.message || "Validation failed. Please check your input.";
    case 429:
      return "Too many requests. Please wait before trying again.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
      return "Service temporarily unavailable. Please try again later.";
    case 503:
      return "Service unavailable. Please try again later.";
    case 504:
      return "Gateway timeout. Please try again later.";
    default:
      if (error.status >= 500) {
        return "Server error. Please try again later.";
      }
      return error.message || "An unexpected error occurred.";
  }
};

// Get user-friendly error type for UI handling
export const getErrorType = (
  error: ApiError
): "network" | "auth" | "validation" | "server" | "rate-limit" | "unknown" => {
  if (error.isNetworkError) return "network";
  if (error.status === 401 || error.status === 403) return "auth";
  if (error.status === 400 || error.status === 422) return "validation";
  if (error.status === 429) return "rate-limit";
  if (error.status >= 500) return "server";
  return "unknown";
};

// Check if error should trigger logout
export const shouldLogoutOnError = (error: ApiError): boolean => {
  return error.status === 401;
};

// Check if error is recoverable (user can retry)
export const isRecoverableError = (error: ApiError): boolean => {
  return error.isRetryable || error.isNetworkError || error.status >= 500;
};

// Export the API client for advanced usage
export { apiClient };
// Comprehensive Access Overview API Functions
export const accessOverviewApi = {
  getUserAccessMatrix: async (): Promise<{
    users: Array<{
      user: {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        user_type_name: string;
        user_type_value: number;
        is_active: boolean;
      };
      assignedModules: number[];
      totalAssigned: number;
    }>;
    modules: Array<{
      module_id: number;
      module_name: string;
      short_description: string;
      is_active: boolean;
    }>;
    totalUsers: number;
    totalModules: number;
  }> => {
    return apiClient.get("/admin/access-matrix");
  },

  getUserTypePermissions: async (): Promise<{
    userTypes: Array<{
      user_type_id: number;
      user_type_name: string;
      user_type_value: number;
      defaultModules: number[];
      totalDefaultModules: number;
    }>;
    allModules: Array<{
      module_id: number;
      module_name: string;
      short_description: string;
      is_active: boolean;
    }>;
  }> => {
    return apiClient.get("/admin/user-type-permissions");
  },

  getPermissionAnalytics: async (): Promise<{
    userTypeStats: Array<{
      user_type: string;
      userCount: number;
      activeUsers: number;
      averageModulesPerUser: number;
    }>;
    moduleStats: Array<{
      module_id: number;
      module_name: string;
      assignedUsers: number;
      assignmentRate: number;
    }>;
    overallStats: {
      totalUsers: number;
      totalModules: number;
      totalAssignments: number;
      averageModulesPerUser: number;
    };
  }> => {
    return apiClient.get("/admin/permission-analytics");
  },

  bulkAssignModules: async (data: {
    user_ids: number[];
    module_ids: number[];
    action: "assign" | "unassign";
  }): Promise<{
    message: string;
    results: {
      success: Array<{
        user_id: number;
        module_id: number;
        action: string;
      }>;
      failed: Array<{
        user_id: number;
        module_id: number;
        error: string;
      }>;
    };
  }> => {
    return apiClient.post("/admin/bulk-assign-modules", data);
  },
};
export default apiClient;
