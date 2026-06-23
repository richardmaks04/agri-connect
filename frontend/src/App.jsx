import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';
import { initOfflineSync } from './utils/offlineQueue';
import api from './utils/api';

// Shared components
import Navbar              from './components/shared/Navbar';
import ProtectedRoute      from './components/shared/ProtectedRoute';
import OfflineBanner       from './components/shared/OfflineBanner';
import FloatingActionButton from './components/shared/FloatingActionButton';

// Pages
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import Dashboard        from './components/dashboard/Dashboard';
import ArticleViewer    from './components/content/ArticleViewer';
import CreateContent    from './components/content/CreateContent';
import SavedPage        from './components/content/SavedPage';
import CommunityPage    from './components/community/CommunityPage';
import QuestionDetail   from './components/community/QuestionDetail';
import SearchPage       from './components/search/SearchPage';
import ProfilePage      from './components/auth/ProfilePage';
import AdminDashboard   from './components/admin/AdminDashboard';

import { setInitialised } from './store/slices/authSlice';
// Layout wrapper for authenticated pages (includes Navbar + offline banner)
function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-earth-100">
      <Navbar />
      <OfflineBanner />
      <main className="pt-2">
        {children}
      </main>
      <FloatingActionButton />
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { isInitialised } = useSelector(s => s.auth);

  // ── On mount: restore session + init offline sync ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(fetchCurrentUser());
    else {
      // No token — mark as initialised so ProtectedRoute can redirect
        dispatch(setInitialised());
      
    }

    // Init offline queue replay when connectivity returns
    initOfflineSync((config) => api(config));
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Public routes ──────────────────────────────────────────────── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ─── Protected routes (require login) ───────────────────────────── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/content/new" element={
          <ProtectedRoute>
            <AppLayout><CreateContent /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/content/:id" element={
          <ProtectedRoute>
            <AppLayout><ArticleViewer /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/saved" element={
          <ProtectedRoute>
            <AppLayout><SavedPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/community" element={
          <ProtectedRoute>
            <AppLayout><CommunityPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/community/questions/:id" element={
          <ProtectedRoute>
            <AppLayout><QuestionDetail /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/search" element={
          <ProtectedRoute>
            <AppLayout><SearchPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout><ProfilePage /></AppLayout>
          </ProtectedRoute>
        } />

        {/* ─── Admin only ──────────────────────────────────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        } />

        {/* ─── Default redirect ────────────────────────────────────────────── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
