import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ProfileDetailPage } from './pages/ProfileDetailPage';
import { StoryModeStandalonePage } from './pages/StoryModeStandalonePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminProfileEditPage } from './pages/AdminProfileEditPage';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { NetworkAdsLoader } from './components/NetworkAdsLoader';
import { AnalyticsTracker } from './components/AnalyticsTracker';

export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      {/* Global Network Ads Controller (Popunder & Social Bar) */}
      <NetworkAdsLoader />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/profile/:slug" element={<ProfileDetailPage />} />
        <Route path="/story/:slug" element={<StoryModeStandalonePage />} />

        {/* Admin Login Route (Publicly accessible form) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected Admin Routes - Only Authenticated Administrators */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/profiles/new"
          element={
            <AdminProtectedRoute>
              <AdminProfileEditPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/profiles/:id/edit"
          element={
            <AdminProtectedRoute>
              <AdminProfileEditPage />
            </AdminProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
