import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeed } from '../../store/slices/contentSlice';
import ContentCard from '../shared/ContentCard';

const SPEC_EMOJIS = {
  cereal_crops: '🌽', poultry: '🐔', fisheries: '🐟', horticulture: '🥬', legumes: '🫘',
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { feed, isLoading, isLoadingMore, pagination } = useSelector(s => s.content);

  useEffect(() => { dispatch(fetchFeed({ page: 1 })); }, [dispatch]);

  const primarySpec = user?.profile?.farmingSpecializations?.[0]?.primary;
  const firstName = user?.profile?.fullName?.split(' ')[0] || 'Farmer';

  const loadMore = () => {
    if (pagination && pagination.page < pagination.pages) {
      dispatch(fetchFeed({ page: pagination.page + 1 }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl font-display font-bold">
              {firstName} {primarySpec && SPEC_EMOJIS[primarySpec]}
            </h1>
            <p className="text-primary-100 text-sm mt-1">
              Your personalised farming feed is ready.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-xs text-primary-200">Today</p>
              <p className="font-bold">{new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Articles Read', value: user?.statistics?.interactionHistory?.length || 0, icon: '📚' },
          { label: 'Saved', value: user?.statistics?.contentSaved?.length || 0, icon: '📌' },
          { label: 'Reputation', value: user?.social?.reputation || 0, icon: '⭐' },
        ].map(stat => (
          <div key={stat.label} className="card text-center py-4">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-primary-700">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Content Feed */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          📰 Your Personalised Feed
        </h2>
        <span className="text-xs text-gray-400">Sorted by relevance</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full mb-1" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : feed.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-gray-600 font-medium">No articles yet</p>
          <p className="text-sm text-gray-400 mt-1">Check back soon — content is being added.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {feed.map(item => (
              <ContentCard key={item._id} content={item} />
            ))}
          </div>
          {pagination && pagination.page < pagination.pages && (
            <button onClick={loadMore} disabled={isLoadingMore}
              className="btn-secondary w-full mt-5 py-3">
              {isLoadingMore ? 'Loading…' : 'Load More Articles'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
