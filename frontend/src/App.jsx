import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Users from './pages/admin/Users.jsx';
import Locations from './pages/admin/Locations.jsx';
import WorksiteTypes from './pages/admin/WorksiteTypes.jsx';
import Planning from './pages/admin/Planning.jsx';
import Stats from './pages/admin/Stats.jsx';
import MySchedule from './pages/visitor/MySchedule.jsx';

const AppLayout = ({ children }) => {
  const isMobile = window.innerWidth < 768;
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <main style={{
        flex: 1,
        padding: isMobile ? '72px 16px 24px' : '32px',
        background: '#f8fafc',
        overflowY: 'auto',
        minWidth: 0
      }}>
        {children}
      </main>
    </div>
  );
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/visitor" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/visitor" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout><Users /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout><Locations /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/worksite-types"
            element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout><WorksiteTypes /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/planning"
            element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout><Planning /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout><Stats /></AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/visitor"
            element={<AppLayout><MySchedule /></AppLayout>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
