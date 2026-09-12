import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, sans-serif',
        color: '#475569'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #0284c7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.roleSlug || user.roleName || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      // Redirect unauthorized user to their own role dashboard
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
    }
  }

  return children;
};

export default ProtectedRoute;
