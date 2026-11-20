import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import StarRating from './StarRating';

export default function UserDetailModal({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.getUserDetail(userId);
        setUser(data);
      } catch (err) {
        setError(err.message || 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [userId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (!userId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Details</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading-spinner">Loading user details...</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {user && (
            <div className="user-detail-content">
              {/* Profile Information Section */}
              <div className="detail-section">
                <h4>Profile Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">User ID:</span>
                    <span className="detail-value">#{user.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value font-semibold">{user.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{user.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Role:</span>
                    <div className="detail-badge-wrap">
                      <span className={`role-badge badge-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{user.address}</span>
                  </div>
                </div>
              </div>

              {/* Show rating and store information if the user is a store owner */}
              {user.isStoreOwner && (
                <div className="detail-section store-detail-card">
                  <h4>Owned Store & Rating Performance</h4>
                  {user.store ? (
                    <div className="store-rating-box">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Store Name:</span>
                          <span className="detail-value font-bold">{user.store.name}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Store Email:</span>
                          <span className="detail-value">{user.store.email}</span>
                        </div>
                        <div className="detail-item full-width">
                          <span className="detail-label">Store Address:</span>
                          <span className="detail-value">{user.store.address}</span>
                        </div>
                        <div className="detail-item full-width rating-highlight">
                          <span className="detail-label">Store Average Rating:</span>
                          <div className="modal-rating-row">
                            <StarRating value={user.store.averageRating} />
                            <span className="modal-rating-badge">
                              ★ {Number(user.store.averageRating).toFixed(1)} / 5.0
                            </span>
                            <span className="modal-rating-count">
                              ({user.store.totalRatings} customer rating{user.store.totalRatings !== 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted italic">
                      This user has the OWNER role but does not have a store assigned yet.
                    </p>
                  )}
                </div>
              )}

              {/* Rating History Section (for normal users and users who submitted ratings) */}
              {(!user.isStoreOwner || (user.ratings && user.ratings.length > 0)) && (
                <div className="detail-section rating-history-section">
                  <h4>Rating History</h4>
                  {user.ratings && user.ratings.length > 0 ? (
                    <div className="rating-history-list">
                      {user.ratings.map((r) => (
                        <div key={r.id} className="rating-history-item">
                          <div className="rating-history-header">
                            <div className="rating-history-store">
                              <span className="rating-store-icon">🏬</span>
                              <span className="rating-store-name font-semibold">{r.storeName}</span>
                            </div>
                            <div className="rating-history-stars-wrap">
                              <span className="rating-history-label">Rating:</span>
                              <div className="rating-history-stars">
                                <StarRating value={r.value} size="sm" />
                              </div>
                              <span className="rating-history-score font-semibold">
                                {r.value}/5
                              </span>
                            </div>
                          </div>
                          {r.createdAt && (
                            <div className="rating-history-meta">
                              <span className="rating-history-date">
                                📅 Submitted on {formatDate(r.createdAt)}
                              </span>
                              {r.storeAddress && (
                                <span className="rating-history-address" title={r.storeAddress}>
                                  📍 {r.storeAddress}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rating-history-empty">
                      <p className="text-muted italic">No ratings submitted yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
