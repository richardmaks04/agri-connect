import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Floating Action Button (FAB)
 * Provides quick access to main actions from anywhere in the app
 */
export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  if (!user) return null;

  const actions = [
    {
      id: 'ask',
      label: 'Ask Question',
      icon: '💬',
      action: () => {
        navigate('/community');
        setOpen(false);
      },
      show: true,
    },
    {
      id: 'create',
      label: 'Create Article',
      icon: '📝',
      action: () => {
        console.log('[Publish Article] FAB create clicked', {
          userRole: user?.role,
          target: '/content/new',
        });
        navigate('/content/new');
        setOpen(false);
      },
      show: true,
    },
    {
      id: 'search',
      label: 'Search',
      icon: '🔍',
      action: () => {
        navigate('/search');
        setOpen(false);
      },
      show: true,
    },
  ].filter(a => a.show);

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Menu items */}
        {open && (
          <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 space-y-2 min-w-max">
            {actions.map(action => (
              <button
                key={action.id}
                onClick={action.action}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-medium text-gray-800">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 ${
            open
              ? 'bg-red-500 hover:bg-red-600 rotate-45'
              : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {open ? '✕' : '+'}
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
