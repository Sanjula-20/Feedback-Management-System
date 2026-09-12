import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import DepartmentAdminDashboard from './pages/DepartmentAdminDashboard';

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const userRole = (user.roleSlug || user.roleName || '').toLowerCase();
  switch (userRole) {
    case 'super-admin':
    case 'superadmin':
      return <Navigate to="/super-admin" replace />;
    case 'department-admin':
    case 'deptadmin':
      return <Navigate to="/department-admin" replace />;
    case 'faculty':
    case 'staff':
      return <Navigate to="/faculty" replace />;
    case 'student':
    default:
      return <Navigate to="/student" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super-admin', 'superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['faculty', 'staff']}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/department-admin"
            element={
              <ProtectedRoute allowedRoles={['department-admin', 'deptadmin']}>
                <DepartmentAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
