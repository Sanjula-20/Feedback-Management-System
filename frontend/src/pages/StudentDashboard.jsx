import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-badge">STUDENT PORTAL</div>
          <h2>College Feedback System</h2>
        </div>
        <div className="user-profile-bar">
          <div className="user-info-text">
            <div className="user-name">{user?.userName || 'Student User'}</div>
            <div className="user-role">Student ({user?.userNumber})</div>
          </div>
          <button className="btn-logout" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="welcome-card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)' }}>
          <div>
            <h1>WELCOME STUDENT</h1>
            <p>Logged in as: {user?.userName} ({user?.userNumber})</p>
          </div>
          <div className="welcome-badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Role: Student</div>
        </section>

        <section className="dashboard-section" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ color: '#0f172a', marginBottom: '12px' }}>Protected Student Feedback Portal Placeholder</h3>
          <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto 24px' }}>
            Authenticated successfully. The full student feedback submission workflow, subject evaluation forms, and private queries will be enabled here in the next phase.
          </p>
          <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', display: 'inline-block' }}>
            <span style={{ color: '#0284c7', fontWeight: '600' }}>✓ Protected Student Route Verified</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
