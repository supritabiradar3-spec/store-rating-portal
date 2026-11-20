import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import StarRating from '../components/StarRating';

export default function OwnerDashboard({ currentUser }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table sorting
  const [sortBy, setSortBy] = useState('userName');
  const [order, setOrder] = useState('ASC');

  const fetchDashboard = async (storeId = null) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getOwnerDashboard(storeId);
      setDashboardData(data);
      if (data.selectedStoreId) {
        setSelectedStoreId(data.selectedStoreId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load owner dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setOrder('ASC');
    }
  };

  // Helper to remove any accidental duplicated leading initial from customer name (e.g., "PPriya" -> "Priya")
  const getCleanCustomerName = (rawName) => {
    if (!rawName) return '';
    const name = String(rawName).trim();
    if (name.length >= 2 && name[0] === name[1] && /^[A-Z]$/.test(name[0])) {
      return name.slice(1);
    }
    return name;
  };

  // Sort ratings list locally
  const sortedRatings = useMemo(() => {
    if (!dashboardData || !dashboardData.ratings) return [];
    const list = [...dashboardData.ratings];
    list.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (sortBy === 'value') {
        valA = Number(valA);
        valB = Number(valB);
        return order === 'ASC' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string') {
        const cmp = String(valA).localeCompare(String(valB));
        return order === 'ASC' ? cmp : -cmp;
      }
      return 0;
    });
    return list;
  }, [dashboardData, sortBy, order]);

  const renderSortArrow = (field) => {
    if (sortBy === field) {
      return (
        <span className="sort-arrow active-arrow" aria-label={`Sorted ${order}`}>
          {order === 'ASC' ? '▲' : '▼'}
        </span>
      );
    }
    return (
      <span className="sort-arrow inactive-arrow" aria-label="Sortable">
        ↕
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="owner-loading-state">
          <div className="owner-loading-spinner"></div>
          <p className="owner-loading-text">Loading store dashboard details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!dashboardData?.hasStore) {
    return (
      <div className="page-container">
        <div className="empty-state-card">
          <div className="empty-icon">🏪</div>
          <h3>No Store Assigned</h3>
          <p className="text-muted">
            Your account is registered as a Store Owner, but an Administrator has not yet assigned a store to your account.
          </p>
          <p className="text-muted">
            Please contact your system administrator to configure your store.
          </p>
        </div>
      </div>
    );
  }

  const { store, averageRating, totalRatings } = dashboardData;
  const numAverageRating = Number(averageRating) || 0;

  return (
    <div className="page-container owner-dashboard-container">
      {/* 1. Header Hero Banner */}
      <div className="owner-hero-banner">
        <div className="owner-hero-info">
          <div className="owner-badge-row">
            <span className="owner-portal-badge">🏪 Store Owner Portal</span>
            <span className="owner-user-pill">
              Logged in as <strong>{currentUser?.name || 'Store Owner'}</strong>
            </span>
          </div>
          <h2 className="owner-main-heading">Store Owner Dashboard</h2>
          <p className="owner-main-subtitle">
            Overview of customer satisfaction scores, ratings breakdown, and verified feedback for your store.
          </p>
        </div>
      </div>

      {/* 2. Multi-Store Selector (Clean Selectable Store Cards) */}
      {dashboardData.stores && dashboardData.stores.length > 1 && (
        <div className="owner-stores-selector-container">
          <div className="owner-stores-selector-header">
            <div>
              <h3 className="owner-stores-selector-title">Your Stores</h3>
              <p className="owner-stores-selector-subtitle">
                Select a store to view its detailed performance, customer ratings, and reviews
              </p>
            </div>
            <span className="owner-stores-count-badge">
              {dashboardData.stores.length} Managed Stores
            </span>
          </div>

          <div className="owner-store-cards-grid">
            {dashboardData.stores.map((s) => {
              const isSelected = s.id === (selectedStoreId || store.id);
              const storeAvg = Number(s.averageRating) > 0 ? Number(s.averageRating).toFixed(1) : '0.0';
              const reviewsText = `${s.totalRatings} ${s.totalRatings === 1 ? 'review' : 'reviews'}`;

              return (
                <button
                  key={s.id}
                  type="button"
                  className={`owner-store-select-card ${isSelected ? 'store-card-active' : ''}`}
                  onClick={() => {
                    if (!isSelected) {
                      setSelectedStoreId(s.id);
                      fetchDashboard(s.id);
                    }
                  }}
                  aria-pressed={isSelected}
                >
                  <div className="store-card-header-line">
                    <div className="store-card-title-group">
                      <span className="store-card-icon">🏬</span>
                      <h4 className="store-card-name">{s.name}</h4>
                    </div>
                    {isSelected ? (
                      <span className="store-card-active-pill">✓ Selected</span>
                    ) : (
                      <span className="store-card-switch-hint">Select</span>
                    )}
                  </div>

                  <div className="store-card-body">
                    <div className="store-card-meta-item">
                      <span className="meta-icon">📍</span>
                      <span className="meta-text" title={s.address}>
                        {s.address}
                      </span>
                    </div>
                    <div className="store-card-meta-item">
                      <span className="meta-icon">✉️</span>
                      <span className="meta-text" title={s.email}>
                        {s.email}
                      </span>
                    </div>
                  </div>

                  <div className="store-card-footer">
                    <span className="store-card-rating-chip">
                      ★ {storeAvg} · {reviewsText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single Store Info Strip (When owner manages 1 store) */}
      {(!dashboardData.stores || dashboardData.stores.length <= 1) && (
        <div className="owner-single-store-card">
          <div className="single-store-icon-bubble">🏬</div>
          <div className="single-store-details">
            <h3 className="single-store-name">{store.name}</h3>
            <div className="single-store-meta-line">
              <span className="single-meta-item">
                <span className="meta-icon">📍</span> {store.address}
              </span>
              <span className="single-meta-divider">•</span>
              <span className="single-meta-item">
                <span className="meta-icon">✉️</span> {store.email}
              </span>
              <span className="single-meta-divider">•</span>
              <span className="single-meta-item">
                <span className="meta-icon">★</span> {numAverageRating > 0 ? numAverageRating.toFixed(1) : '0.0'} · {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Two Balanced Metric Cards: Average Rating & Total Reviews */}
      <div className="owner-metrics-grid-two">
        {/* Metric 1: Average Store Rating */}
        <div className="owner-metric-card owner-metric-highlight">
          <div className="metric-card-header">
            <span className="metric-tag tag-amber">AVERAGE RATING</span>
            <div className="metric-icon-bubble bubble-amber">⭐</div>
          </div>
          <div className="metric-card-content">
            <div className="metric-rating-number-row">
              <span className="metric-big-score">{numAverageRating.toFixed(1)}</span>
              <span className="metric-max-score">/ 5.0</span>
            </div>
            <div className="owner-stars-row">
              <StarRating value={numAverageRating} size="md" />
            </div>
            <div className="metric-pill-row">
              <span
                className={`performance-badge ${
                  numAverageRating >= 4.5
                    ? 'badge-excellent'
                    : numAverageRating >= 3.5
                    ? 'badge-good'
                    : numAverageRating > 0
                    ? 'badge-average'
                    : 'badge-empty'
                }`}
              >
                {numAverageRating >= 4.5
                  ? '★ Excellent Rating'
                  : numAverageRating >= 3.5
                  ? '★ Great Customer Rating'
                  : numAverageRating > 0
                  ? '★ Moderate Performance'
                  : 'No Ratings Recorded'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Reviews */}
        <div className="owner-metric-card">
          <div className="metric-card-header">
            <span className="metric-tag tag-emerald">TOTAL REVIEWS</span>
            <div className="metric-icon-bubble bubble-emerald">👥</div>
          </div>
          <div className="metric-card-content">
            <div className="metric-rating-number-row">
              <span className="metric-big-score">{totalRatings}</span>
              <span className="metric-reviews-sub">
                &nbsp;Verified {totalRatings === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
            <p className="metric-explainer-text">
              Total individual customer ratings submitted for this store.
            </p>
            <div className="metric-pill-row">
              <span className="metric-engagement-pill">
                {totalRatings > 0 ? '✓ Verified Feedback' : 'Awaiting First Review'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Customer Ratings & Reviews Section */}
      <div className="owner-reviews-section">
        <div className="owner-reviews-header">
          <div>
            <h3 className="reviews-section-title">Customer Ratings & Reviews</h3>
            <p className="reviews-section-subtitle">
              Submitted feedback from verified customers for <strong>{store.name}</strong>
            </p>
          </div>
          <div className="reviews-counter-pill">
            {sortedRatings.length} Total {sortedRatings.length === 1 ? 'Review' : 'Reviews'}
          </div>
        </div>

        <div className="owner-table-card">
          <div className="table-responsive">
            <table className="owner-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort('userName')}
                    className={`sortable-th ${sortBy === 'userName' ? 'active-th' : ''}`}
                    title="Click to sort by Customer Name"
                  >
                    Customer Name {renderSortArrow('userName')}
                  </th>
                  <th
                    onClick={() => handleSort('userEmail')}
                    className={`sortable-th ${sortBy === 'userEmail' ? 'active-th' : ''}`}
                    title="Click to sort by Email Address"
                  >
                    Email Address {renderSortArrow('userEmail')}
                  </th>
                  <th
                    onClick={() => handleSort('userAddress')}
                    className={`sortable-th ${sortBy === 'userAddress' ? 'active-th' : ''}`}
                    title="Click to sort by Address"
                  >
                    Customer Address {renderSortArrow('userAddress')}
                  </th>
                  <th
                    onClick={() => handleSort('value')}
                    className={`sortable-th text-center ${sortBy === 'value' ? 'active-th' : ''}`}
                    title="Click to sort by Rating"
                  >
                    Rating Given {renderSortArrow('value')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRatings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="owner-empty-row">
                      <div className="owner-empty-content">
                        <span className="owner-empty-icon">💬</span>
                        <h4>No customer ratings yet</h4>
                        <p>
                          Customers have not submitted ratings for <strong>{store.name}</strong> yet. Ratings will automatically appear here as customers submit feedback.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedRatings.map((rating) => {
                    const cleanName = getCleanCustomerName(rating.userName);
                    const initial = cleanName ? cleanName.charAt(0).toUpperCase() : 'U';
                    return (
                      <tr key={rating.id} className="owner-row-item">
                        <td className="customer-name-cell">
                          <div className="customer-flex">
                            <div className="customer-avatar" aria-hidden="true">
                              {initial}
                            </div>
                            <span className="customer-full-name">{cleanName}</span>
                          </div>
                        </td>
                        <td className="customer-email-cell">
                          <span className="email-badge">{rating.userEmail}</span>
                        </td>
                        <td className="customer-address-cell">
                          <span className="address-text" title={rating.userAddress}>
                            {rating.userAddress}
                          </span>
                        </td>
                        <td className="customer-rating-cell text-center">
                          <div className="clean-star-box">
                            <StarRating value={rating.value} size="md" />
                            <span className="star-score-pill">{Number(rating.value).toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
