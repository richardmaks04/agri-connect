import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Empty State Guidance Component
 * Shows helpful prompts when there's no content
 */
export function EmptyStateNoQuestions() {
  const navigate = useNavigate();

  return (
    <div className="card text-center py-12 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
      <div className="text-5xl mb-4">🌾</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No questions here yet!
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Be the first to start a conversation! Ask the community about farming challenges and get advice from experts.
      </p>
      <button
        onClick={() => navigate('/community')}
        className="btn-primary inline-block"
      >
        + Ask a Question
      </button>
    </div>
  );
}

/**
 * Empty State for Saved Articles
 */
export function EmptyStateSavedArticles() {
  const navigate = useNavigate();

  return (
    <div className="card text-center py-12 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
      <div className="text-5xl mb-4">📌</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No saved articles yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Bookmark articles you want to read later. You'll find them all here for quick access.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn-primary inline-block"
      >
        Explore Articles
      </button>
    </div>
  );
}

/**
 * Empty State for Search Results
 */
export function EmptyStateSearchResults({ query }) {
  return (
    <div className="card text-center py-12 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No results for "{query}"
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Try searching with different keywords, or browse our categories to find what you're looking for.
      </p>
    </div>
  );
}

/**
 * Empty State for Answers/Replies
 */
export function EmptyStateNoAnswers() {
  return (
    <div className="card text-center py-8 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
      <div className="text-4xl mb-3">💬</div>
      <p className="text-gray-600 text-sm">
        No answers yet — be the first to help! 👇
      </p>
    </div>
  );
}

/**
 * Empty State for Articles (No Content Created)
 */
export function EmptyStateNoArticles() {
  return (
    <div className="card text-center py-12 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
      <div className="text-5xl mb-4">📝</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No articles published yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Share your expertise by creating articles and guides to help farmers in your community.
      </p>
    </div>
  );
}

/**
 * Generic Empty State Component
 */
export function EmptyState({ 
  icon = '🌾', 
  title, 
  description, 
  actionLabel, 
  onAction,
  gradient = 'from-blue-50 to-blue-100',
  borderColor = 'border-blue-200'
}) {
  return (
    <div className={`card text-center py-12 bg-gradient-to-br ${gradient} border-2 ${borderColor}`}>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary inline-block"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
