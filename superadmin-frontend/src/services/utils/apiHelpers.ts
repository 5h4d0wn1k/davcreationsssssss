import { AxiosResponse } from 'axios';
import { ApiResponse, ErrorResponse } from '../types/common';
import { ERROR_MESSAGES, HTTP_STATUS } from './constants';
import toast from 'react-hot-toast';

export function handleApiResponse<T>(response: AxiosResponse): ApiResponse<T> {
  const { data, status } = response;

  if (status >= HTTP_STATUS.OK && status < HTTP_STATUS.BAD_REQUEST) {
    return {
      success: true,
      message: data.message || 'Success',
      data: data.data || data,
    };
  }

  return {
    success: false,
    message: data.message || 'An error occurred',
    error: data.error || 'Unknown error',
  };
}

export function handleApiError(error: unknown): ErrorResponse {
  const err = error as { response?: { status: number; data: { error?: string; message?: string } } };
  let errorMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR;
  let errorDetails = 'Unknown error';

  if (err.response) {
    const { status, data } = err.response;

    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
        errorDetails = data.error || 'Unauthorized';
        break;
      case HTTP_STATUS.FORBIDDEN:
        errorMessage = ERROR_MESSAGES.FORBIDDEN;
        errorDetails = data.error || 'Forbidden';
        break;
      case HTTP_STATUS.NOT_FOUND:
        errorMessage = ERROR_MESSAGES.NOT_FOUND;
        errorDetails = data.error || 'Not found';
        break;
      case HTTP_STATUS.BAD_REQUEST:
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        errorMessage = data.message || ERROR_MESSAGES.VALIDATION_ERROR;
        errorDetails = data.error || 'Validation error';
        break;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        errorMessage = ERROR_MESSAGES.SERVER_ERROR;
        errorDetails = data.error || 'Internal server error';
        break;
      default:
        errorMessage = data.message || ERROR_MESSAGES.UNKNOWN_ERROR;
        errorDetails = data.error || 'Unknown error';
        break;
    }

    // Show toast notification for API errors
    toast.error(errorMessage);
  } else {
    const err2 = error as { request?: unknown };
    if (err2.request) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      errorDetails = 'Network error';
      toast.error('Network error - please check your connection');
    } else {
      errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
      errorDetails = (error as { message?: string }).message || 'Unknown error';
      toast.error('An unexpected error occurred');
    }
  }

  return {
    success: false,
    message: errorMessage,
    error: errorDetails,
    statusCode: err.response?.status || 0,
  };
}

export function createQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export function formatApiUrl(endpoint: string, baseUrl: string = ''): string {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  return `${baseUrl}${endpoint}`;
}