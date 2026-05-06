import React from 'react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export default function OfflineBanner() {
  const { isOffline } = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-amber-500 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2 shadow-md">
      <span>📵</span>
      <span>You are offline. Saved content is still available. Actions will sync when you reconnect.</span>
    </div>
  );
}
