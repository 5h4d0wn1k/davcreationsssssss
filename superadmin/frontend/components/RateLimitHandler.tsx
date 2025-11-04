'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RateLimitFallback } from './FallbackUI';
import { Alert } from './FormError';

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number | null;
  message: string;
  operationId: string | null;
}

interface RateLimitHandlerProps {
  children: React.ReactNode;
  onRateLimitExceeded?: (retryAfter: number, operationId: string) => void;
  onRateLimitCleared?: (operationId: string) => void;
}

export const RateLimitHandler: React.FC<RateLimitHandlerProps> = ({
  children,
  onRateLimitExceeded,
  onRateLimitCleared
}) => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    retryAfter: null,
    message: '',
    operationId: null,
  });

  const [countdown, setCountdown] = useState<number>(0);

  // Countdown timer for rate limit
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (rateLimitState.isLimited && rateLimitState.retryAfter) {
      setCountdown(rateLimitState.retryAfter);

      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Rate limit period has ended
            clearRateLimit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rateLimitState.isLimited, rateLimitState.retryAfter]);

  const triggerRateLimit = useCallback((
    retryAfter: number,
    message: string = 'Too many requests. Please wait before trying again.',
    operationId: string = 'general'
  ) => {
    setRateLimitState({
      isLimited: true,
      retryAfter,
      message,
      operationId,
    });

    if (onRateLimitExceeded) {
      onRateLimitExceeded(retryAfter, operationId);
    }

    // Auto-clear after the retry period
    setTimeout(() => {
      clearRateLimit();
    }, retryAfter * 1000);
  }, [onRateLimitExceeded]);

  const clearRateLimit = useCallback(() => {
    const operationId = rateLimitState.operationId;
    setRateLimitState({
      isLimited: false,
      retryAfter: null,
      message: '',
      operationId: null,
    });

    if (onRateLimitCleared && operationId) {
      onRateLimitCleared(operationId);
    }
  }, [rateLimitState.operationId, onRateLimitCleared]);

  const canRetry = rateLimitState.isLimited && countdown <= 0;

  // Global rate limit handler that can be called from anywhere
  useEffect(() => {
    const handleRateLimit = (event: CustomEvent) => {
      const { retryAfter, message, operationId } = event.detail;
      triggerRateLimit(retryAfter, message, operationId);
    };

    window.addEventListener('rateLimitExceeded' as any, handleRateLimit as any);

    return () => {
      window.removeEventListener('rateLimitExceeded' as any, handleRateLimit as any);
    };
  }, [triggerRateLimit]);

  // Expose methods globally for API error handling
  useEffect(() => {
    (window as any).rateLimitHandler = {
      triggerRateLimit,
      clearRateLimit,
      isLimited: rateLimitState.isLimited,
    };

    return () => {
      delete (window as any).rateLimitHandler;
    };
  }, [triggerRateLimit, clearRateLimit, rateLimitState.isLimited]);

  const handleRetry = () => {
    if (canRetry) {
      clearRateLimit();
    }
  };

  return (
    <>
      {children}

      {/* Rate Limit Modal/Overlay */}
      {rateLimitState.isLimited && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {}} />

          <div className="relative glass rounded-2xl p-6 w-full max-w-md text-center">
            <RateLimitFallback
              retryAfter={countdown}
              onRetry={canRetry ? handleRetry : undefined}
            />

            {/* Additional context */}
            <div className="mt-4 text-sm text-muted">
              {rateLimitState.operationId && rateLimitState.operationId !== 'general' && (
                <p>Operation: <span className="font-medium">{rateLimitState.operationId}</span></p>
              )}
              <p className="mt-2">
                This helps prevent system overload. Please wait for the timer to complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Banner (less intrusive) */}
      {rateLimitState.isLimited && countdown > 10 && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-yellow-500 text-yellow-900 px-4 py-2 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Rate limit active</span>
              <span>• Try again in {Math.ceil(countdown / 60)}m {countdown % 60}s</span>
            </div>
            <button
              onClick={clearRateLimit}
              className="text-yellow-800 hover:text-yellow-900 underline text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Hook for components to trigger rate limiting
export const useRateLimit = () => {
  const triggerRateLimit = useCallback((retryAfter: number, message?: string, operationId?: string) => {
    if ((window as any).rateLimitHandler) {
      (window as any).rateLimitHandler.triggerRateLimit(retryAfter, message, operationId);
    } else {
      console.warn('RateLimitHandler not available');
    }
  }, []);

  const clearRateLimit = useCallback(() => {
    if ((window as any).rateLimitHandler) {
      (window as any).rateLimitHandler.clearRateLimit();
    }
  }, []);

  const isLimited = (window as any).rateLimitHandler?.isLimited || false;

  return {
    triggerRateLimit,
    clearRateLimit,
    isLimited,
  };
};