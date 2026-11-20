import React, { useState } from 'react';
import { api } from '../services/api';
import { validateEmail } from '../utils/validation';

export default function Login({ onLoginSuccess, onNavigateSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ email, password });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for demo accounts
  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        {/* 1. Store Rating Portal Logo and Title at the top of the card */}
        <div className="login-brand-header">
          <div className="login-brand-icon-wrap">
            <span className="login-brand-icon">⭐</span>
          </div>
          <h1 className="login-brand-title">Store Rating Portal</h1>
        </div>

        {/* 2. Welcome Back and Subtitle below branding */}
        <div className="login-welcome-section">
          <h2 className="login-welcome-title">Welcome Back</h2>
          <p className="login-welcome-subtitle">Sign in to your account to continue</p>
        </div>

        {error && <div className="alert alert-error login-alert">{error}</div>}

        {/* 3. Form with Email, Password, and Prominent Sign In button */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-username">Email Address</label>
            <input
              type="email"
              id="login-username"
              name="username"
              autoComplete="username"
              className="input-control"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              name="password"
              autoComplete="current-password"
              className="input-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-login-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* 4. Three Quick Demo Buttons in a neat, compact layout */}
        <div className="login-quick-demo">
          <div className="quick-demo-divider">
            <span className="divider-label">Quick Demo Logins</span>
          </div>
          <div className="quick-demo-grid">
            <button
              type="button"
              className="quick-demo-card-btn"
              onClick={() => fillCredentials('admin@storerating.com', 'Admin@999')}
              title="Autofill System Administrator credentials"
            >
              <span className="quick-demo-icon">👑</span>
              <span className="quick-demo-role">Admin</span>
            </button>
            <button
              type="button"
              className="quick-demo-card-btn"
              onClick={() => fillCredentials('alex.owner@storerating.com', 'Owner@456')}
              title="Autofill Store Owner credentials"
            >
              <span className="quick-demo-icon">🏪</span>
              <span className="quick-demo-role">Store Owner</span>
            </button>
            <button
              type="button"
              className="quick-demo-card-btn"
              onClick={() => fillCredentials('jessica@example.com', 'User@456')}
              title="Autofill Normal User credentials"
            >
              <span className="quick-demo-icon">👤</span>
              <span className="quick-demo-role">Normal User</span>
            </button>
          </div>
        </div>

        {/* 5. Signup link at the bottom */}
        <div className="login-card-footer">
          <span>Don't have an account yet?</span>{' '}
          <button type="button" className="login-signup-link" onClick={onNavigateSignup}>
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
}
