'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getNetworkStatus, setNetworkStatus } from '../lib/api';
import { OfflineFallback } from './FallbackUI';

interface NetworkStatusContextType {
  isOnline: boolean;
  wasOffline: boolean;
  connectionQuality: 'good' | 'slow' | 'poor' | 'offline';
  lastOnlineTime: Date | null;
  reconnect: () => Promise<boolean>;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

export const useNetworkStatus = () => {
  const context = useContext(NetworkStatusContext);
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
};

interface NetworkStatusProviderProps {
  children: ReactNode;
  showOfflineBanner?: boolean;
}

export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({
  children,
  showOfflineBanner = true
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'slow' | 'poor' | 'offline'>('good');
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(new Date());
  const [showReconnectPrompt, setShowReconnectPrompt] = useState(false);

  // Initialize network status
  useEffect(() => {
    setIsOnline(getNetworkStatus());
    setLastOnlineTime(new Date());
  }, []);

  // Network event listeners
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Connection restored');
      setIsOnline(true);
      setNetworkStatus(true);
      setConnectionQuality('good');
      setLastOnlineTime(new Date());
      setWasOffline(false);
      setShowReconnectPrompt(false);
    };

    const handleOffline = () => {
      console.log('Network: Connection lost');
      setIsOnline(false);
      setNetworkStatus(false);
      setConnectionQuality('offline');
      setWasOffline(true);
      setShowReconnectPrompt(true);
    };

    // Connection quality monitoring
    let connectionCheckInterval: NodeJS.Timeout;

    const checkConnectionQuality = async () => {
      if (!isOnline) return;

      try {
        const startTime = Date.now();
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (responseTime < 500) {
          setConnectionQuality('good');
        } else if (responseTime < 2000) {
          setConnectionQuality('slow');
        } else {
          setConnectionQuality('poor');
        }
      } catch (error) {
        // If health check fails, assume poor connection
        setConnectionQuality('poor');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start connection quality monitoring
    connectionCheckInterval = setInterval(checkConnectionQuality, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
    };
  }, [isOnline]);

  const reconnect = async (): Promise<boolean> => {
    try {
      // Try to ping a reliable endpoint
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (response.ok) {
        setIsOnline(true);
        setNetworkStatus(true);
        setConnectionQuality('good');
        setLastOnlineTime(new Date());
        setWasOffline(false);
        setShowReconnectPrompt(false);
        return true;
      }
    } catch (error) {
      console.log('Reconnection attempt failed:', error);
    }

    return false;
  };

  const handleReconnect = async () => {
    const success = await reconnect();
    if (!success) {
      // Show a message that reconnection failed
      console.log('Reconnection failed, will retry automatically');
    }
  };

  const value = {
    isOnline,
    wasOffline,
    connectionQuality,
    lastOnlineTime,
    reconnect,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}

      {/* Offline Banner */}
      {showOfflineBanner && showReconnectPrompt && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">You're offline</span>
              <span className="text-red-200">• Some features may not be available</span>
            </div>
            <button
              onClick={handleReconnect}
              className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Connection Quality Indicator */}
      {isOnline && connectionQuality !== 'good' && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            connectionQuality === 'slow' ? 'bg-yellow-500 text-yellow-900' :
            connectionQuality === 'poor' ? 'bg-orange-500 text-orange-900' :
            'bg-gray-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionQuality === 'slow' ? 'bg-yellow-700' :
                connectionQuality === 'poor' ? 'bg-orange-700' :
                'bg-gray-700'
              }`} />
              <span>
                {connectionQuality === 'slow' ? 'Slow connection' :
                 connectionQuality === 'poor' ? 'Poor connection' :
                 'Connection issues'}
              </span>
            </div>
          </div>
        </div>
      )}
    </NetworkStatusContext.Provider>
  );
};