import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import StarRating from '../components/StarRating';

export default function UserStoresPage({ currentUser }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters and Sorting
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('ASC');

  // Rating editing state per store: { [storeId]: selectedValue }
  const [pendingRatings, setPendingRatings] = useState({});
  const [submittingStoreId, setSubmittingStoreId] = useState(null);

  const fetchStores = async (overrideName, overrideAddress) => {
    try {
      setLoading(true);
      setError('');
      const qName = overrideName !== undefined ? overrideName : searchName;
      const qAddress = overrideAddress !== undefined ? overrideAddress : searchAddress;
      const data = await api.getStores({
        name: qName,
        address: qAddress,
      });
      setStores(data);

      // Pre-populate pending ratings with user's existing rating
      const initialPending = {};
      data.forEach((s) => {
        initialPending[s.id] = s.myRating || 5;
      });
      setPendingRatings((prev) => ({ ...initialPending, ...prev }));
    } catch (err) {
      setError(err.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStores();
  };

  const handleReset = () => {
    setSearchName('');
    setSearchAddress('');
    fetchStores('', '');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(field);
      setOrder('ASC');
    }
  };

  // Sorting stores locally so search, rating updates, and sorting work seamlessly together
  const sortedStores = useMemo(() => {
    if (!stores || stores.length === 0) return [];
    const list = [...stores];

    list.sort((a, b) => {
      let valA, valB;

      if (sortBy === 'name') {
        valA = a.name || '';
        valB = b.name || '';
        const cmp = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
        return order === 'ASC' ? cmp : -cmp;
      }

      if (sortBy === 'address') {
        valA = a.address || '';
        valB = b.address || '';
        const cmp = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
        return order === 'ASC' ? cmp : -cmp;
      }

      if (sortBy === 'averageRating' || sortBy === 'rating') {
        valA = Number(a.averageRating) || 0;
        valB = Number(b.averageRating) || 0;
        return order === 'ASC' ? valA - valB : valB - valA;
      }

      if (sortBy === 'myRating') {
        valA = a.myRating !== null && a.myRating !== undefined ? Number(a.myRating) : 0;
        valB = b.myRating !== null && b.myRating !== undefined ? Number(b.myRating) : 0;
        return order === 'ASC' ? valA - valB : valB - valA;
      }

      return 0;
    });

    return list;
  }, [stores, sortBy, order]);

  const handleRatingChange = (storeId, val) => {
    setPendingRatings((prev) => ({ ...prev, [storeId]: val }));
  };

  const handleSubmitRating = async (storeId) => {
    const val = pendingRatings[storeId] || 5;
    try {
      setSubmittingStoreId(storeId);
      setSuccessMsg('');
      setError('');
      const res = await api.submitRating(storeId, val);
      setSuccessMsg(`Rating saved for store! (${val} stars)`);

      // Update store in local state immediately
      setStores((prev) =>
        prev.map((s) => {
          if (s.id === storeId) {
            return {
              ...s,
              myRating: val,
              averageRating: res.storeOverallRating,
              totalRatings: res.totalRatings,
            };
          }
          return s;
        })
      );

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save rating');
    } finally {
      setSubmittingStoreId(null);
    }
  };

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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Explore Stores</h2>
          <p className="page-subtitle">
            Browse registered stores, view overall ratings, and submit or modify your ratings
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="search-filter-card">
        <div className="search-row">
          <div className="search-field">
            <label htmlFor="search-name-input">Search by Store Name</label>
            <input
              id="search-name-input"
              type="text"
              className="input-control"
              placeholder="e.g. Supermarket, Bookstore..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div className="search-field">
            <label htmlFor="search-address-input">Search by Address</label>
            <input
              id="search-address-input"
              type="text"
              className="input-control"
              placeholder="e.g. Main Street, Suite 400..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
            />
          </div>
          <div className="search-actions">
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Stores Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className={`sortable-th ${sortBy === 'name' ? 'active-th' : ''}`}
                  title="Click to sort by Store Name"
                >
                  Store Name {renderSortArrow('name')}
                </th>
                <th>Email</th>
                <th
                  onClick={() => handleSort('address')}
                  className={`sortable-th ${sortBy === 'address' ? 'active-th' : ''}`}
                  title="Click to sort by Address"
                >
                  Address {renderSortArrow('address')}
                </th>
                <th
                  onClick={() => handleSort('averageRating')}
                  className={`sortable-th ${sortBy === 'averageRating' ? 'active-th' : ''}`}
                  title="Click to sort by Overall Rating"
                >
                  Overall Rating {renderSortArrow('averageRating')}
                </th>
                <th
                  onClick={() => handleSort('myRating')}
                  className={`sortable-th ${sortBy === 'myRating' ? 'active-th' : ''}`}
                  title="Click to sort by Your Rating"
                >
                  Your Rating {renderSortArrow('myRating')}
                </th>
                <th>Submit / Modify Rating</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    Loading stores...
                  </td>
                </tr>
              ) : sortedStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No stores found matching your search criteria.
                  </td>
                </tr>
              ) : (
                sortedStores.map((store) => (
                  <tr key={store.id}>
                    <td className="font-semibold">{store.name}</td>
                    <td>{store.email}</td>
                    <td className="store-address-cell">{store.address}</td>
                    <td>
                      <div className="rating-cell">
                        <StarRating value={store.averageRating} />
                        <span className="rating-pill">
                          ★ {store.averageRating}
                        </span>
                        <small className="text-muted">
                          ({store.totalRatings} review{store.totalRatings !== 1 ? 's' : ''})
                        </small>
                      </div>
                    </td>
                    <td>
                      {store.myRating ? (
                        <span className="user-rating-pill">
                          ★ {store.myRating} / 5
                        </span>
                      ) : (
                        <span className="text-muted italic">Not rated</span>
                      )}
                    </td>
                    <td>
                      <div className="rating-action-group">
                        <div className="star-selector">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              className={`star-btn ${
                                (pendingRatings[store.id] || store.myRating || 5) >= val
                                  ? 'active'
                                  : ''
                              }`}
                              onClick={() => handleRatingChange(store.id, val)}
                              title={`Select ${val} star${val > 1 ? 's' : ''}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={submittingStoreId === store.id}
                          onClick={() => handleSubmitRating(store.id)}
                        >
                          {submittingStoreId === store.id
                            ? 'Saving...'
                            : store.myRating
                            ? 'Update'
                            : 'Submit'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
