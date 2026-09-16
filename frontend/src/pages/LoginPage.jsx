import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username/register number and password.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await login(username.trim(), password);
      if (res.success) {
        navigate(res.redirectUrl || '/super-admin');
      } else {
        setError(res.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setError('An unexpected network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-bg-placeholder"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="college-logo-container">
            <img src="/assets/college-logo.png" alt="National Engineering College" className="college-logo-img" />
          </div>
          <h1>National Engineering College</h1>
          <p>Feedback Management System</p>
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username / Register Number</label>
            <div className="input-wrapper">
              <input
                id="username"
                type="text"
                placeholder="Enter your Register No. or Staff ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="forgot-password-container">
            <a href="#forgot" className="forgot-password-link" onClick={(e) => { e.preventDefault(); alert('Please contact your Department Administrator or System Admin to reset your password.'); }}>
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn-login" disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <div className="social-login-divider">
          <span>Log in using your account on:</span>
        </div>

        <button type="button" className="btn-google-login" onClick={() => alert('Google Single Sign-On is currently in preview mode.')}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.01 10.05.01 12s.45 3.8 1.26 5.42l4.01-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          Google Account
        </button>

        <div className="first-time-info">
          <h4>First time logging in?</h4>
          <p>Your default login details are:</p>
          <ul>
            <li><strong>Student:</strong> Register Number & College Portal Password</li>
            <li><strong>Faculty / Admin:</strong> Staff Code or Institutional Email</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
