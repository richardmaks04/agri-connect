import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import ContentCard from '../shared/ContentCard';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export default function SavedPage() {
  const [saved, setSaved]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOffline }         = useOfflineStatus();

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users/saved');
        setSaved(data.saved || []);
      } catch (_) {}
      setLoading(false);
    };
    fetchSaved();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-display font-bold text-gray-800">📌 Saved Articles</h1>
          <p className="text-sm text-gray-500">
            {isOffline
              ? '📵 Offline — showing cached content only'
              : 'Articles saved for offline reading'}
          </p>
        </div>
        <span className="badge-green">{saved.length} saved</span>
      </div>

      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          <strong>You are offline.</strong> You can still read your saved articles below.
          Any changes you make will sync when you reconnect.
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : saved.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📌</p>
          <p className="text-gray-600 font-medium">No saved articles yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Tap the 📌 Save button on any article to read it offline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map(item => (
            <ContentCard key={item._id} content={item} />
          ))}
        </div>
      )}
    </div>
  );
}
