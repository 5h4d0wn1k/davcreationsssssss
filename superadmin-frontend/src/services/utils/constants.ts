export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    REGISTER: '/user/register',
    LOGIN: '/user/login',
    LOGOUT: '/user/logout',
    LOGOUT_ALL: '/user/logout/all',
    FORGOT_PASSWORD: '/user/forgot/password',
    SEND_OTP: '/user/send-otp',
    VERIFY_OTP: '/user/verify-otp',
    GOOGLE_LOGIN: '/user/google/login',
    USER_DATA: '/user/data',
  },

  // User management endpoints
  USERS: {
    LIST: '/users',
    CREATE: '/admin/users',
    GET_BY_ID: (id: string) => `/admin/users/${id}`,
    UPDATE: (id: string) => `/admin/users/${id}`,
    DELETE: (id: string) => `/admin/delete/user/${id}`,
    HARD_DELETE: (id: string) => `/admin/hard/delete/user/${id}`,
    RECOVER: (id: string) => `/admin/recover/user/${id}`,
    CHANGE_USERTYPE: (id: string) => `/admin/change/usertype/user/${id}`,
    LOGOUT_USER: (id: string) => `/admin/logout/user/${id}`,
    ADMIN_LIST: '/admin/users/all',
  },

  // Module management endpoints
  MODULES: {
    LIST: '/admin/modules',
    CREATE: '/admin/modules',
    GET_BY_ID: (id: string) => `/admin/modules/${id}`,
    UPDATE: (id: string) => `/admin/modules/${id}`,
    DEACTIVATE: (id: string) => `/admin/modules/${id}/deactivate`,
    DELETE: (id: string) => `/admin/modules/${id}`,
    BULK_UPDATE: '/admin/modules/bulk-update',
  },

  // Permission management endpoints
  PERMISSIONS: {
    USER_MODULES: (userId: string) => `/admin/users/${userId}/modules`,
    ASSIGN_MODULE: '/admin/assign/module',
    UNASSIGN_MODULE: '/admin/unassign/module',
    BULK_ASSIGN_MODULES: '/admin/bulk/assign/modules',
  },

  // User type management endpoints
  USER_TYPES: {
    LIST: '/admin/user-types',
    CREATE: '/admin/user-types',
    GET_BY_ID: (id: string) => `/admin/user-types/${id}`,
    UPDATE: (id: string) => `/admin/user-types/${id}`,
    DELETE: (id: string) => `/admin/user-types/${id}`,
  },
  // Dashboard endpoints
  DASHBOARD: {
    METRICS: '/dashboard/metrics',
    ACTIVITIES: '/dashboard/activities',
    USER_STATS: '/dashboard/user-stats',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An internal server error occurred.',
  VALIDATION_ERROR: 'Please check your input data.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
} as const;