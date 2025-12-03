'use client';

import { useEffect, useCallback } from 'react';
import { useConnectionStore, useSettingsStore } from '@/store';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export function ConnectionStatus() {
  const { 
    isOnline, 
    isBackendReachable, 
    lastChecked, 
    retryCount,
    setOnline, 
    setBackendReachable, 
    setLastChecked, 
    incrementRetry,
    resetRetry 
  } = useConnectionStore();
  
  const { apiUrl } = useSettingsStore();
  
  const checkBackendConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/api/v1/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setBackendReachable(true);
        resetRetry();
      } else {
        setBackendReachable(false);
        incrementRetry();
      }
    } catch (error) {
      setBackendReachable(false);
      incrementRetry();
    }
    setLastChecked(new Date().toISOString());
  }, [apiUrl, setBackendReachable, setLastChecked, incrementRetry, resetRetry]);

  // Check connection on mount and periodically
  useEffect(() => {
    // Initial check
    checkBackendConnection();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000);
    
    return () => clearInterval(interval);
  }, [checkBackendConnection]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      checkBackendConnection();
    };
    
    const handleOffline = () => {
      setOnline(false);
      setBackendReachable(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, setBackendReachable, checkBackendConnection]);

  // Format last checked time
  const formatLastChecked = () => {
    if (!lastChecked) return 'Never';
    const date = new Date(lastChecked);
    return date.toLocaleTimeString();
  };

  // Don't show anything if fully connected
  if (isOnline && isBackendReachable) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-sm animate-fade-in ${
        !isOnline 
          ? 'bg-red-50 border-red-200 text-red-800' 
          : !isBackendReachable 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-green-50 border-green-200 text-green-800'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {!isOnline ? (
            <WifiOff className="w-5 h-5 text-red-600" />
          ) : !isBackendReachable ? (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          ) : (
            <Wifi className="w-5 h-5 text-green-600" />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-sm">
            {!isOnline 
              ? 'No Internet Connection' 
              : !isBackendReachable 
                ? 'Server Unavailable'
                : 'Connected'
            }
          </h4>
          
          <p className="text-sm mt-1 opacity-90">
            {!isOnline 
              ? 'You are working offline. Changes will sync when connection is restored.' 
              : !isBackendReachable 
                ? 'Unable to reach the server. Some features may be limited.'
                : 'All systems operational.'
            }
          </p>
          
          {retryCount > 0 && (
            <p className="text-xs mt-2 opacity-75">
              Connection attempts: {retryCount} • Last check: {formatLastChecked()}
            </p>
          )}
          
          {!isBackendReachable && isOnline && (
            <button
              onClick={checkBackendConnection}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-yellow-100 hover:bg-yellow-200 transition-colors"
              aria-label="Retry connection"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline banner version for use in headers/layouts
export function ConnectionBanner() {
  const { isOnline, isBackendReachable } = useConnectionStore();
  
  // Don't show anything if fully connected
  if (isOnline && isBackendReachable) {
    return null;
  }

  return (
    <div 
      className={`px-4 py-2 text-center text-sm font-medium ${
        !isOnline 
          ? 'bg-red-600 text-white' 
          : 'bg-yellow-500 text-yellow-900'
      }`}
      role="alert"
    >
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline. Changes will sync when connected.</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" />
            <span>Unable to reach server. Some features may be limited.</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectionStatus;
