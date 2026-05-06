import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArticle, clearCurrentArticle, saveContent } from '../../store/slices/contentSlice';
import api from '../../utils/api';

export default function ArticleViewer() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentArticle, isLoading } = useSelector(s => s.content);
  const { user } = useSelector(s => s.auth);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    dispatch(fetchArticle(id));
    return () => dispatch(clearCurrentArticle());
  }, [id, dispatch]);

  useEffect(() => {
    if (currentArticle && user) {
      setSaved(user.statistics?.contentSaved?.includes(currentArticle._id));
    }
  }, [currentArticle, user]);

  const handleLike = async () => {
    if (liked) return;
    try {
      await api.post(`/content/${id}/like`);
      setLiked(true);
    } catch (_) {}
  };

  const handleSave = async () => {
    const result = await dispatch(saveContent(id));
    if (saveContent.fulfilled.match(result)) {
      setSaved(result.payload.saved);
    }
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-100 rounded w-1/4 mb-8" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-100 rounded mb-3" />
      ))}
    </div>
  );

  if (!currentArticle) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-3">😕</p>
      <p className="text-gray-600">Article not found.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-4">← Go Back</button>
    </div>
  );

  const a = currentArticle;
  const specLabel = a.metadata?.farmingSpecializations?.[0]?.replace('_', ' ') || '';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 md:pb-6">
      {/* Back button */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        ← Back
      </button>

      {/* Article header */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {specLabel && <span className="badge-green capitalize">{specLabel}</span>}
          {a.metadata?.difficulty && (
            <span className="badge-amber capitalize">{a.metadata.difficulty}</span>
          )}
          <span className="badge-gray capitalize">{a.contentType}</span>
        </div>

        <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight mb-3">
          {a.title}
        </h1>

        {a.summary && (
          <p className="text-gray-500 text-base border-l-4 border-primary-400 pl-4 italic mb-4">
            {a.summary}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
              {a.author?.name?.[0] || 'E'}
            </div>
            <div>
              <p className="font-medium text-gray-700">{a.author?.name || 'Expert'}</p>
              <p className="text-xs capitalize text-gray-400">{a.author?.role}</p>
            </div>
          </div>
          <div className="text-right">
            <p>{new Date(a.publishedAt || a.createdAt).toLocaleDateString('en-NG')}</p>
            <p className="text-xs">{a.statistics?.views || 0} views</p>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="card mb-6">
        <div
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
          style={{ lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: a.content }}
        />
      </div>

      {/* Tags */}
      {a.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {a.tags.map(tag => (
            <span key={tag} className="badge-gray">#{tag}</span>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="card flex items-center justify-between gap-4">
        <div className="flex gap-3">
          <button onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
              liked ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>
            {liked ? '❤️' : '🤍'} {(a.statistics?.likes || 0) + (liked ? 1 : 0)}
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
              saved ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>
            {saved ? '📌 Saved' : '📌 Save for offline'}
          </button>
        </div>
        <div className="text-xs text-gray-400">
          💾 {a.statistics?.saves || 0} saves
        </div>
      </div>
    </div>
  );
}
