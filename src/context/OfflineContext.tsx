import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { GasApiService } from '../services/gasApi';

interface OfflineContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
  isSyncing: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updateQueueCount = () => {
    const queue = StorageService.getSyncQueue();
    setPendingSyncCount(queue.length);
  };

  useEffect(() => {
    updateQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-flush queue when connection is restored
      if (GasApiService.isConfigured()) {
        syncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check on queue
    const interval = setInterval(updateQueueCount, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const syncNow = async () => {
    if (isSyncing || !isOnline || !GasApiService.isConfigured()) return;
    setIsSyncing(true);
    try {
      await GasApiService.flushSyncQueue();
      updateQueueCount();
    } catch (e) {
      console.warn('Sync flush error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingSyncCount,
        syncNow,
        isSyncing,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within an OfflineProvider');
  return ctx;
};
