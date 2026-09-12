import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-badge">FACULTY PORTAL</div>
          <h2>College Feedback System</h2>
        </div>
        <div className="user-profile-bar">
          <div className="user-info-text">
            <div className="user-name">{user?.userName || 'Faculty User'}</div>
            <div className="user-role">Faculty ({user?.userNumber})</div>
          </div>
          <button className="btn-logout" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="welcome-card" style={{ background: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' }}>
          <div>
            <h1>WELCOME FACULTY MEMBER</h1>
            <p>Logged in as: {user?.userName} ({user?.userNumber})</p>
          </div>
          <div className="welcome-badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Role: Faculty</div>
        </section>

        <section className="dashboard-section" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ color: '#0f172a', marginBottom: '12px' }}>Protected Faculty Dashboard Placeholder</h3>
          <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto 24px' }}>
            Authenticated successfully. Faculty subject rating reports and student feedback statistics will be displayed here in subsequent releases.
          </p>
          <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'inline-block' }}>
            <span style={{ color: '#059669', fontWeight: '600' }}>✓ Protected Faculty Route Verified</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FacultyDashboard;
