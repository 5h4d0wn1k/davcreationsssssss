'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LoadingOverlay } from './LoadingSpinner';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  operations: Set<string>;
}

interface GlobalLoadingContextType {
  isLoading: boolean;
  loadingMessage?: string;
  startLoading: (operationId: string, message?: string) => void;
  stopLoading: (operationId: string) => void;
  clearAllLoading: () => void;
  withLoading: <T>(
    operationId: string,
    operation: () => Promise<T>,
    message?: string
  ) => Promise<T>;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
};

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    operations: new Set(),
  });

  const startLoading = useCallback((operationId: string, message?: string) => {
    setLoadingState(prev => {
      const newOperations = new Set(prev.operations);
      newOperations.add(operationId);

      return {
        isLoading: newOperations.size > 0,
        message: message || prev.message,
        operations: newOperations,
      };
    });
  }, []);

  const stopLoading = useCallback((operationId: string) => {
    setLoadingState(prev => {
      const newOperations = new Set(prev.operations);
      newOperations.delete(operationId);

      return {
        isLoading: newOperations.size > 0,
        message: newOperations.size > 0 ? prev.message : undefined,
        operations: newOperations,
      };
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      operations: new Set(),
    });
  }, []);

  const withLoading = useCallback(async <T,>(
    operationId: string,
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(operationId, message);

    try {
      const result = await operation();
      return result;
    } finally {
      stopLoading(operationId);
    }
  }, [startLoading, stopLoading]);

  const value = {
    isLoading: loadingState.isLoading,
    loadingMessage: loadingState.message,
    startLoading,
    stopLoading,
    clearAllLoading,
    withLoading,
  };

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      {loadingState.isLoading && (
        <LoadingOverlay message={loadingState.message} />
      )}
    </GlobalLoadingContext.Provider>
  );
};