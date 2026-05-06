import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/slices/authSlice';

const SPECIALIZATIONS = [
  { value: 'cereal_crops', label: '🌽 Cereal Crops (Maize, Rice)' },
  { value: 'poultry',      label: '🐔 Poultry' },
  { value: 'fisheries',    label: '🐟 Fisheries' },
  { value: 'horticulture', label: '🥬 Horticulture (Vegetables)' },
  { value: 'legumes',      label: '🫘 Legumes (Cowpea, Soybean)' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <span className="text-4xl">🌾</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Agri-Connect</h1>
          <p className="text-primary-200 mt-1">Your personalised farming platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email" required className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" required className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-base mt-2">
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Quick login helpers for development */}
          <div className="mt-5 border-t pt-4">
            <p className="text-xs text-gray-400 text-center mb-3">Quick access (dev only)</p>
            <div className="flex gap-2">
              {[
                { label: 'Farmer', email: 'farmer@agriconnect.com', pass: 'Farmer@123' },
                { label: 'Expert', email: 'expert@agriconnect.com', pass: 'Expert@123' },
                { label: 'Admin',  email: 'admin@agriconnect.com',  pass: 'Admin@123' },
              ].map(({ label, email, pass }) => (
                <button key={label}
                  className="flex-1 text-xs py-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
                  onClick={() => dispatch(loginUser({ email, password: pass }))}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            New farmer?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
