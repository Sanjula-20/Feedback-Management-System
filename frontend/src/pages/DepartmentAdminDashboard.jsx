import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const DepartmentAdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-badge">DEPARTMENT ADMIN</div>
          <h2>College Feedback System</h2>
        </div>
        <div className="user-profile-bar">
          <div className="user-info-text">
            <div className="user-name">{user?.userName || 'Dept Admin'}</div>
            <div className="user-role">Department Admin ({user?.userNumber})</div>
          </div>
          <button className="btn-logout" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="welcome-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)' }}>
          <div>
            <h1>WELCOME DEPARTMENT ADMIN</h1>
            <p>Logged in as: {user?.userName} ({user?.userNumber})</p>
          </div>
          <div className="welcome-badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Role: Department Admin</div>
        </section>

        <section className="dashboard-section" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ color: '#0f172a', marginBottom: '12px' }}>Protected Department Admin Dashboard Placeholder</h3>
          <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto 24px' }}>
            Authenticated successfully. Departmental feedback monitoring, faculty mapping controls, and department summaries will be activated here in upcoming releases.
          </p>
          <div style={{ padding: '16px', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe', display: 'inline-block' }}>
            <span style={{ color: '#7c3aed', fontWeight: '600' }}>✓ Protected Department Admin Route Verified</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DepartmentAdminDashboard;
