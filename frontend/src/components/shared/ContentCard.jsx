import React from 'react';
import { Link } from 'react-router-dom';

const SPEC_COLORS = {
  cereal_crops: 'badge-green',
  poultry:      'bg-orange-100 text-orange-700 badge',
  fisheries:    'bg-blue-100 text-blue-700 badge',
  horticulture: 'bg-emerald-100 text-emerald-700 badge',
  legumes:      'bg-yellow-100 text-yellow-700 badge',
  general:      'badge-gray',
};

const SPEC_LABELS = {
  cereal_crops: '🌽 Cereal Crops',
  poultry:      '🐔 Poultry',
  fisheries:    '🐟 Fisheries',
  horticulture: '🥬 Horticulture',
  legumes:      '🫘 Legumes',
  general:      '📋 General',
};

const TYPE_ICONS = { article: '📄', video: '🎥', guide: '📖', infographic: '📊' };

export default function ContentCard({ content, compact = false }) {
  const spec = content.metadata?.farmingSpecializations?.[0] || 'general';
  const timeAgo = (date) => {
    const d = Math.floor((Date.now() - new Date(date)) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d} days ago`;
    if (d < 30) return `${Math.floor(d/7)} weeks ago`;
    return `${Math.floor(d/30)} months ago`;
  };

  return (
    <Link to={`/content/${content._id}`} className="card hover:shadow-md transition-shadow block group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={SPEC_COLORS[spec] || 'badge-gray'}>
            {SPEC_LABELS[spec] || spec}
          </span>
          <span className="badge-gray">
            {TYPE_ICONS[content.contentType]} {content.contentType}
          </span>
          {content.metadata?.difficulty && (
            <span className="badge-amber capitalize">{content.metadata.difficulty}</span>
          )}
        </div>
        {content._relevanceScore > 0 && (
          <div className="shrink-0 text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full">
            {Math.round(content._relevanceScore * 100)}% match
          </div>
        )}
      </div>

      <h3 className={`font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug ${
        compact ? 'text-sm' : 'text-base'
      }`}>
        {content.title}
      </h3>

      {!compact && content.summary && (
        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{content.summary}</p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>✍️ {content.author?.name || 'Expert'}</span>
          <span>•</span>
          <span>{timeAgo(content.publishedAt || content.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>👁 {content.statistics?.views || 0}</span>
          <span>💾 {content.statistics?.saves || 0}</span>
          <span>❤️ {content.statistics?.likes || 0}</span>
        </div>
      </div>
    </Link>
  );
}
