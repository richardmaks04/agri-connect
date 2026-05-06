import { useState, useEffect } from 'react';

/**
 * useOfflineStatus
 * Returns { isOnline, isOffline } reflecting current network state.
 * Also triggers the offline queue replay when coming back online.
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}
