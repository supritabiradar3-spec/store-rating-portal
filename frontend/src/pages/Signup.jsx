import React, { useState } from 'react';
import { api } from '../services/api';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
} from '../utils/validation';

export default function Signup({ onSignupSuccess, onNavigateLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateAll = () => {
    const errs = {};
    const nameErr = validateName(formData.name);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) errs.email = emailErr;

    const passErr = validatePassword(formData.password);
    if (passErr) errs.password = passErr;

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    const addrErr = validateAddress(formData.address);
    if (addrErr) errs.address = addrErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateAll()) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        address: formData.address.trim(),
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onSignupSuccess(res.user);
    } catch (err) {
      setServerError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page-wrapper">
      <div className="signup-card">
        {/* 1. Store Rating Portal Logo and Title at the top of the card */}
        <div className="login-brand-header">
          <div className="login-brand-icon-wrap">
            <span className="login-brand-icon">⭐</span>
          </div>
          <h1 className="login-brand-title">Store Rating Portal</h1>
        </div>

        {/* 2. Create an Account Heading and Subtitle */}
        <div className="login-welcome-section">
          <h2 className="login-welcome-title">Create an Account</h2>
          <p className="login-welcome-subtitle">Register to discover and rate local stores</p>
        </div>

        {serverError && <div className="alert alert-error login-alert">{serverError}</div>}

        {/* 3. Signup Form */}
        <form onSubmit={handleSubmit} className="signup-form">
          {/* Full Name */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="signup-name">
                Full Name <span className="req">*</span>
              </label>
              <span className="char-counter">({formData.name.length}/60 chars)</span>
            </div>
            <input
              type="text"
              id="signup-name"
              name="name"
              autoComplete="name"
              className={`input-control ${errors.name ? 'input-error' : ''}`}
              placeholder="Full Name (20 to 60 characters)"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name ? (
              <small className="error-text">{errors.name}</small>
            ) : (
              <small className="help-text">Between 20 and 60 characters long</small>
            )}
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label htmlFor="signup-email">
              Email Address <span className="req">*</span>
            </label>
            <input
              type="email"
              id="signup-email"
              name="email"
              autoComplete="email"
              className={`input-control ${errors.email ? 'input-error' : ''}`}
              placeholder="e.g. yourname@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <small className="error-text">{errors.email}</small>}
          </div>

          {/* Password & Confirm Password Row */}
          <div className="form-row signup-pass-row">
            <div className="form-group col-half">
              <label htmlFor="signup-password">
                Password <span className="req">*</span>
              </label>
              <input
                type="password"
                id="signup-password"
                name="password"
                autoComplete="new-password"
                className={`input-control ${errors.password ? 'input-error' : ''}`}
                placeholder="8–16 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && <small className="error-text">{errors.password}</small>}
            </div>

            <div className="form-group col-half">
              <label htmlFor="signup-confirm-password">
                Confirm Password <span className="req">*</span>
              </label>
              <input
                type="password"
                id="signup-confirm-password"
                name="confirmPassword"
                autoComplete="new-password"
                className={`input-control ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && (
                <small className="error-text">{errors.confirmPassword}</small>
              )}
            </div>
          </div>

          {/* Compact visible password requirements */}
          <div className="signup-pass-hint">
            <span className="hint-icon">🔒</span>
            <span>Must be 8–16 characters with at least 1 uppercase letter and 1 special character.</span>
          </div>

          {/* Address */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="signup-address">
                Address <span className="req">*</span>
              </label>
              <span className="char-counter">({formData.address.length}/400 max)</span>
            </div>
            <textarea
              id="signup-address"
              name="address"
              autoComplete="street-address"
              rows={2}
              className={`input-control ${errors.address ? 'input-error' : ''}`}
              placeholder="Enter your full address (maximum 400 characters)"
              value={formData.address}
              onChange={handleChange}
              maxLength={400}
              required
            />
            {errors.address && <small className="error-text">{errors.address}</small>}
          </div>

          {/* Prominent Sign Up button consistent with Login button */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-signup-submit"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* 4. Bottom Link */}
        <div className="login-card-footer">
          <span>Already have an account?</span>{' '}
          <button type="button" className="login-signup-link" onClick={onNavigateLogin}>
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
}
