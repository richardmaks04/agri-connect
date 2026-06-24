import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { goToCreateArticlePage } from '../../utils/articleNavigation';

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Home',      icon: '🏠' },
  { to: '/community',  label: 'Community', icon: '👥' },
  { to: '/search',     label: 'Search',    icon: '🔍' },
  { to: '/saved',      label: 'Saved',     icon: '📌' },
];

export default function Navbar() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const initials = user?.profile?.fullName
    ? user.profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="bg-white border-b border-earth-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold text-primary-700 text-lg">
          <span className="text-2xl">🌾</span>
          <span className="hidden sm:inline">Agri-Connect</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(link.to)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <span>{link.icon}</span>{link.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/admin') ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              ⚙️ Admin
            </Link>
          )}
          {user && (
            <Link
              to="/content/new"
              onClick={() => goToCreateArticlePage(navigate, 'navbar-desktop', { userRole: user?.role })}
              className="btn-primary text-sm py-1.5 px-3 ml-2">
              + Publish
            </Link>
          )}
        </div>

        {/* User avatar + menu */}
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-none">{user?.profile?.fullName}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}>
                👤 My Profile
              </Link>
              <Link to="/saved" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}>
                📌 Saved Articles
              </Link>
              <hr className="my-1 border-gray-100" />
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {NAV_LINKS.map(link => (
          <Link key={link.to} to={link.to}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 ${
              pathname.startsWith(link.to) ? 'text-primary-600' : 'text-gray-500'
            }`}>
            <span className="text-lg">{link.icon}</span>
            {link.label}
          </Link>
        ))}
        {user && (
          <Link
            to="/content/new"
            onClick={() => goToCreateArticlePage(navigate, 'navbar-mobile', { userRole: user?.role })}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 ${
              pathname.startsWith('/content/new') ? 'text-primary-600' : 'text-gray-500'
            }`}>
            <span className="text-lg">📝</span>
            Publish
          </Link>
        )}
      </div>
    </nav>
  );
}
