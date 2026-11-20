import React, { useState } from 'react';
import { api } from '../services/api';
import { validatePassword } from '../utils/validation';

export default function ChangePasswordModal({ isOpen, onClose, userEmail }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const currentEmail = userEmail || (() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved)?.email : '';
    } catch {
      return '';
    }
  })();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword) {
      setError('Current password is required');
      return;
    }

    const passError = validatePassword(newPassword);
    if (passError) {
      setError(passError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.changePassword({ oldPassword, newPassword });
      setSuccess('Password updated successfully!');
      setTimeout(() => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Change Password</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Hidden username field for browser password manager recognition */}
          <input
            type="text"
            id="change-password-username"
            name="username"
            autoComplete="username"
            value={currentEmail}
            readOnly
            hidden
            style={{ display: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
          />

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-group">
            <label htmlFor="current-password">Current Password</label>
            <input
              type="password"
              id="current-password"
              name="current-password"
              autoComplete="current-password"
              className="input-control"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              name="new-password"
              autoComplete="new-password"
              className="input-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8-16 chars, 1 uppercase, 1 special char"
              required
            />
            <small className="help-text">
              Must be 8-16 characters with at least 1 uppercase letter and 1 special character.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-new-password">Confirm New Password</label>
            <input
              type="password"
              id="confirm-new-password"
              name="confirm-new-password"
              autoComplete="new-password"
              className="input-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
