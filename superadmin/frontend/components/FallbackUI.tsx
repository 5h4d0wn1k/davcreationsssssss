import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert } from './FormError';

interface OfflineFallbackProps {
  onRetry?: () => void;
  className?: string;
}

export const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  onRetry,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L18.364 5.636m-12.728 12.728L12 12" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">You're offline</h3>
    <p className="text-muted mb-4 max-w-sm">
      It looks like you're not connected to the internet. Some features may not be available.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Try Again
      </button>
    )}
  </div>
);

interface NetworkErrorFallbackProps {
  onRetry?: () => void;
  className?: string;
}

export const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({
  onRetry,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">Connection Error</h3>
    <p className="text-muted mb-4 max-w-sm">
      Unable to connect to the server. Please check your internet connection and try again.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Retry Connection
      </button>
    )}
  </div>
);

interface FeatureUnavailableFallbackProps {
  feature: string;
  reason?: string;
  className?: string;
}

export const FeatureUnavailableFallback: React.FC<FeatureUnavailableFallbackProps> = ({
  feature,
  reason,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{feature} Unavailable</h3>
    <p className="text-muted mb-4 max-w-sm">
      {reason || `The ${feature.toLowerCase()} feature is currently not available. Please try again later.`}
    </p>
  </div>
);

interface DataLoadingFallbackProps {
  message?: string;
  className?: string;
}

export const DataLoadingFallback: React.FC<DataLoadingFallbackProps> = ({
  message = 'Loading data...',
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <LoadingSpinner size="lg" className="mb-4" />
    <p className="text-muted">{message}</p>
  </div>
);

interface EmptyStateFallbackProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyStateFallback: React.FC<EmptyStateFallbackProps> = ({
  title,
  description,
  action,
  icon,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    {icon || (
      <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    {description && <p className="text-muted mb-4 max-w-sm">{description}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {action.label}
      </button>
    )}
  </div>
);

interface RateLimitFallbackProps {
  retryAfter?: number;
  onRetry?: () => void;
  className?: string;
}

export const RateLimitFallback: React.FC<RateLimitFallbackProps> = ({
  retryAfter,
  onRetry,
  className = ''
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Too Many Requests</h3>
      <p className="text-muted mb-4 max-w-sm">
        You've made too many requests. Please wait
        {retryAfter ? ` ${formatTime(retryAfter)}` : ' a moment'} before trying again.
      </p>
      {onRetry && retryAfter && retryAfter <= 0 && (
        <button
          onClick={onRetry}
          className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Try Again
        </button>
      )}
    </div>
  );
};