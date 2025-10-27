import apiClient from './client';
import { API_ENDPOINTS } from '../utils/constants';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  totalModules: number;
  activeModules: number;
  totalUserTypes: number;
  usersUnderManagement?: number;
  assignedModules?: number;
  personalModules?: number;
}

export interface ActivityItem {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'module_assigned' | 'permission_changed' | 'login' | 'logout';
  description: string;
  timestamp: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: Record<string, unknown>;
}

export interface DashboardActivitiesResponse {
  activities: ActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStatsData {
  userRegistrations: number[];
  userActivity: number[];
  categories: string[];
}

export const dashboardService = {
  // Get dashboard metrics based on user role
  async getMetrics(userRole: string): Promise<DashboardMetrics> {
    const response = await apiClient.get<DashboardMetrics>(
      `${API_ENDPOINTS.DASHBOARD.METRICS}?role=${userRole}`
    );
    return response.data!;
  },

  // Get recent activities
  async getActivities(filters?: {
    page?: number;
    limit?: number;
    type?: string;
    userRole?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardActivitiesResponse> {
    const queryString = new URLSearchParams();
    if (filters?.page) queryString.append('page', filters.page.toString());
    if (filters?.limit) queryString.append('limit', filters.limit.toString());
    if (filters?.type) queryString.append('type', filters.type);
    if (filters?.userRole) queryString.append('userRole', filters.userRole);
    if (filters?.userId) queryString.append('userId', filters.userId);
    if (filters?.startDate) queryString.append('startDate', filters.startDate);
    if (filters?.endDate) queryString.append('endDate', filters.endDate);

    const response = await apiClient.get<DashboardActivitiesResponse>(
      `${API_ENDPOINTS.DASHBOARD.ACTIVITIES}?${queryString.toString()}`
    );
    return response.data!;
  },

  // Get user statistics for charts
  async getUserStats(userRole: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<UserStatsData> {
    const response = await apiClient.get<UserStatsData>(
      `${API_ENDPOINTS.DASHBOARD.USER_STATS}?role=${userRole}&period=${period}`
    );
    return response.data!;
  },
};