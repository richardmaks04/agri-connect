import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Quick Action Card Component
 * Shows prominent CTAs for creating content and asking questions
 */
export default function QuickActionsPanel() {
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Ask Question CTA */}
        <div 
          onClick={() => navigate('/community')}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">💬</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                Ask the Community
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Have a farming question? Get advice from experts and fellow farmers.
              </p>
              <button className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1">
                Go to Community →
              </button>
            </div>
          </div>
        </div>

        {/* Create Content CTA - Experts/Admins Only */}
        {['expert', 'extension', 'admin'].includes(user?.role) && (
          <div 
            onClick={() => navigate('/content/new')}
            className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">📝</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                  Create Article
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Share your expertise by creating articles and guides for farmers.
                </p>
                <button className="mt-3 text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1">
                  Create Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Articles */}
        <Link 
          to="/saved"
          className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">📌</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                Saved Articles
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                View and manage your saved articles for later reading.
              </p>
              <button className="mt-3 text-sm font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1">
                View Saved →
              </button>
            </div>
          </div>
        </Link>

        {/* Explore Content */}
        <Link 
          to="/search"
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">🔍</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                Search & Explore
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Find articles and answers about specific farming topics.
              </p>
              <button className="mt-3 text-sm font-medium text-orange-700 hover:text-orange-900 flex items-center gap-1">
                Search →
              </button>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
