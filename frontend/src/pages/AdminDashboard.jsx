import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import StarRating from '../components/StarRating';
import UserDetailModal from '../components/UserDetailModal';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
} from '../utils/validation';

export default function AdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'stores'

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });

  // Users Management State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilters, setUserFilters] = useState({ name: '', email: '', address: '', role: 'ALL' });
  const [userSort, setUserSort] = useState({ by: 'name', order: 'ASC' });
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Stores Management State
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '' });
  const [storeSort, setStoreSort] = useState({ by: 'name', order: 'ASC' });

  // Modal forms
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [potentialOwners, setPotentialOwners] = useState([]);

  // Notifications
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch Stats
  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  // Fetch Users
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const params = {
        name: userFilters.name,
        email: userFilters.email,
        address: userFilters.address,
        role: userFilters.role,
        sortBy: userSort.by,
        order: userSort.order,
      };
      const data = await api.getAdminUsers(params);
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Stores
  const loadStores = async () => {
    try {
      setLoadingStores(true);
      const params = {
        name: storeFilters.name,
        email: storeFilters.email,
        address: storeFilters.address,
        sortBy: storeSort.by,
        order: storeSort.order,
      };
      const data = await api.getAdminStores(params);
      setStores(data);
    } catch (err) {
      setError(err.message || 'Failed to load stores');
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [userSort]);

  useEffect(() => {
    loadStores();
  }, [storeSort]);

  const handleUserFilterSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleStoreFilterSubmit = (e) => {
    e.preventDefault();
    loadStores();
  };

  const handleUserSort = (field) => {
    setUserSort((prev) => ({
      by: field,
      order: prev.by === field && prev.order === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  const handleStoreSort = (field) => {
    setStoreSort((prev) => ({
      by: field,
      order: prev.by === field && prev.order === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  const renderUserSortArrow = (field) => {
    if (userSort.by === field) {
      return (
        <span className="sort-arrow active-arrow" aria-label={`Sorted ${userSort.order}`}>
          {userSort.order === 'ASC' ? '▲' : '▼'}
        </span>
      );
    }
    return (
      <span className="sort-arrow inactive-arrow" aria-label="Sortable">
        ↕
      </span>
    );
  };

  const renderStoreSortArrow = (field) => {
    if (storeSort.by === field) {
      return (
        <span className="sort-arrow active-arrow" aria-label={`Sorted ${storeSort.order}`}>
          {storeSort.order === 'ASC' ? '▲' : '▼'}
        </span>
      );
    }
    return (
      <span className="sort-arrow inactive-arrow" aria-label="Sortable">
        ↕
      </span>
    );
  };

  const openAddStore = async () => {
    try {
      const owners = await api.getPotentialOwners();
      setPotentialOwners(owners);
      setShowAddStoreModal(true);
    } catch (err) {
      setError(err.message || 'Failed to load users for store assignment');
    }
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h2>Admin Control Center</h2>
          <p className="page-subtitle">
            System overview, manage platform users, stores, and ratings
          </p>
        </div>
        <div className="header-action-buttons">
          <button
            className="btn btn-outline"
            onClick={() => setShowAddUserModal(true)}
          >
            + Add User
          </button>
          <button
            className="btn btn-primary"
            onClick={openAddStore}
          >
            + Add Store
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Dashboard Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="text-muted text-sm">Admins, Owners & Normal Users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏬</div>
          <div className="stat-content">
            <span className="stat-label">Total Stores</span>
            <span className="stat-value">{stats.totalStores}</span>
            <span className="text-muted text-sm">Registered commercial stores</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <span className="stat-label">Total Ratings</span>
            <span className="stat-value">{stats.totalRatings}</span>
            <span className="text-muted text-sm">Customer ratings submitted</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users Management ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          Stores Management ({stores.length})
        </button>
      </div>

      {/* ================= USERS TAB ================= */}
      {activeTab === 'users' && (
        <div className="tab-content">
          {/* User Filters Form */}
          <form onSubmit={handleUserFilterSubmit} className="search-filter-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Filter by Name</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Filter name..."
                  value={userFilters.name}
                  onChange={(e) =>
                    setUserFilters((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Filter by Email</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Filter email..."
                  value={userFilters.email}
                  onChange={(e) =>
                    setUserFilters((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Filter by Address</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Filter address..."
                  value={userFilters.address}
                  onChange={(e) =>
                    setUserFilters((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Filter by Role</label>
                <select
                  className="input-control"
                  value={userFilters.role}
                  onChange={(e) =>
                    setUserFilters((prev) => ({ ...prev, role: e.target.value }))
                  }
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>
            </div>
            <div className="filter-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                Apply Filters
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setUserFilters({ name: '', email: '', address: '', role: 'ALL' });
                  setTimeout(loadUsers, 0);
                }}
              >
                Reset Filters
              </button>
            </div>
          </form>

          {/* Users Table */}
          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleUserSort('name')}
                      className={`sortable-th ${userSort.by === 'name' ? 'active-th' : ''}`}
                      title="Click to sort by Name"
                    >
                      Name {renderUserSortArrow('name')}
                    </th>
                    <th
                      onClick={() => handleUserSort('email')}
                      className={`sortable-th ${userSort.by === 'email' ? 'active-th' : ''}`}
                      title="Click to sort by Email"
                    >
                      Email {renderUserSortArrow('email')}
                    </th>
                    <th
                      onClick={() => handleUserSort('address')}
                      className={`sortable-th ${userSort.by === 'address' ? 'active-th' : ''}`}
                      title="Click to sort by Address"
                    >
                      Address {renderUserSortArrow('address')}
                    </th>
                    <th
                      onClick={() => handleUserSort('role')}
                      className={`sortable-th ${userSort.by === 'role' ? 'active-th' : ''}`}
                      title="Click to sort by Role"
                    >
                      Role {renderUserSortArrow('role')}
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No users match the specified filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td className="font-semibold">{u.name}</td>
                        <td>{u.email}</td>
                        <td className="table-address-cell">{u.address}</td>
                        <td>
                          <span className={`role-badge badge-${u.role.toLowerCase()}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline btn-xs"
                            onClick={() => setSelectedUserId(u.id)}
                            title="View full details and store rating if owner"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= STORES TAB ================= */}
      {activeTab === 'stores' && (
        <div className="tab-content">
          {/* Store Filters Form */}
          <form onSubmit={handleStoreFilterSubmit} className="search-filter-card">
            <div className="filter-grid filter-grid-3">
              <div className="form-group">
                <label htmlFor="filter-store-name">Filter by Store Name</label>
                <input
                  id="filter-store-name"
                  type="text"
                  className="input-control"
                  placeholder="Filter store name..."
                  value={storeFilters.name}
                  onChange={(e) =>
                    setStoreFilters((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="filter-store-email">Filter by Email</label>
                <input
                  id="filter-store-email"
                  type="text"
                  className="input-control"
                  placeholder="Filter store email..."
                  value={storeFilters.email}
                  onChange={(e) =>
                    setStoreFilters((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="filter-store-address">Filter by Address</label>
                <input
                  id="filter-store-address"
                  type="text"
                  className="input-control"
                  placeholder="Filter store address..."
                  value={storeFilters.address}
                  onChange={(e) =>
                    setStoreFilters((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="filter-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                Apply Filters
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setStoreFilters({ name: '', email: '', address: '' });
                  setTimeout(loadStores, 0);
                }}
              >
                Reset Filters
              </button>
            </div>
          </form>

          {/* Stores Table */}
          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      onClick={() => handleStoreSort('name')}
                      className={`sortable-th ${storeSort.by === 'name' ? 'active-th' : ''}`}
                      title="Click to sort by Store Name"
                    >
                      Store Name {renderStoreSortArrow('name')}
                    </th>
                    <th
                      onClick={() => handleStoreSort('email')}
                      className={`sortable-th ${storeSort.by === 'email' ? 'active-th' : ''}`}
                      title="Click to sort by Email"
                    >
                      Email {renderStoreSortArrow('email')}
                    </th>
                    <th
                      onClick={() => handleStoreSort('address')}
                      className={`sortable-th ${storeSort.by === 'address' ? 'active-th' : ''}`}
                      title="Click to sort by Address"
                    >
                      Address {renderStoreSortArrow('address')}
                    </th>
                    <th
                      onClick={() => handleStoreSort('rating')}
                      className={`sortable-th ${storeSort.by === 'rating' ? 'active-th' : ''}`}
                      title="Click to sort by Rating"
                    >
                      Overall Rating {renderStoreSortArrow('rating')}
                    </th>
                    <th>Assigned Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStores ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        Loading stores...
                      </td>
                    </tr>
                  ) : stores.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No stores found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    stores.map((s) => {
                      const avgRating = Number(s.averageRating) || 0;
                      const formattedAvg = avgRating > 0 ? avgRating.toFixed(1) : '0.0';
                      const count = s.totalRatings || 0;
                      const reviewText = `${count} ${count === 1 ? 'review' : 'reviews'}`;

                      return (
                        <tr key={s.id}>
                          <td className="font-semibold">{s.name}</td>
                          <td>{s.email}</td>
                          <td className="table-address-cell">{s.address}</td>
                          <td>
                            {count > 0 ? (
                              <div className="admin-rating-badge">
                                <span className="admin-rating-score">★ {formattedAvg}/5</span>
                                <span className="admin-rating-sep">·</span>
                                <span className="admin-rating-count">{reviewText}</span>
                              </div>
                            ) : (
                              <span className="admin-rating-empty">0.0/5 · 0 reviews</span>
                            )}
                          </td>
                          <td>
                            <span className="owner-tag">
                              👤 {s.ownerName || (s.ownerId ? `Owner #${s.ownerId}` : 'Unassigned')}
                            </span>
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
      )}

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSuccess={(newMsg) => {
            setMessage(newMsg);
            setShowAddUserModal(false);
            loadUsers();
            loadStats();
            setTimeout(() => setMessage(''), 3000);
          }}
        />
      )}

      {/* Add Store Modal */}
      {showAddStoreModal && (
        <AddStoreModal
          potentialOwners={potentialOwners}
          onClose={() => setShowAddStoreModal(false)}
          onSuccess={(newMsg) => {
            setMessage(newMsg);
            setShowAddStoreModal(false);
            loadStores();
            loadStats();
            setTimeout(() => setMessage(''), 3000);
          }}
        />
      )}
    </div>
  );
}

// Modal Component to Add Users (Admin or Normal)
function AddUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'USER',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errs = {};
    const nameErr = validateName(formData.name);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) errs.email = emailErr;

    const passErr = validatePassword(formData.password);
    if (passErr) errs.password = passErr;

    const addrErr = validateAddress(formData.address);
    if (addrErr) errs.address = addrErr;

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);
      await api.adminCreateUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        address: formData.address.trim(),
        role: formData.role,
      });
      onSuccess(`User "${formData.name.trim()}" created successfully!`);
    } catch (err) {
      setServerError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New User</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {serverError && <div className="alert alert-error">{serverError}</div>}

          <div className="form-group">
            <label>
              Full Name <span className="req">*</span>{' '}
              <span className="char-counter">({formData.name.length}/60)</span>
            </label>
            <input
              type="text"
              name="name"
              className={`input-control ${errors.name ? 'input-error' : ''}`}
              placeholder="Name (20 to 60 characters)"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && <small className="error-text">{errors.name}</small>}
            <small className="help-text">Must be between 20 and 60 characters.</small>
          </div>

          <div className="form-group">
            <label>Email Address <span className="req">*</span></label>
            <input
              type="email"
              name="email"
              className={`input-control ${errors.email ? 'input-error' : ''}`}
              placeholder="Valid email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <small className="error-text">{errors.email}</small>}
          </div>

          <div className="form-row">
            <div className="form-group col-half">
              <label>Password <span className="req">*</span></label>
              <input
                type="password"
                name="password"
                className={`input-control ${errors.password ? 'input-error' : ''}`}
                placeholder="8-16 chars, 1 uppercase, 1 special"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password && <small className="error-text">{errors.password}</small>}
            </div>

            <div className="form-group col-half">
              <label>User Role <span className="req">*</span></label>
              <select
                name="role"
                className="input-control"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="USER">USER (Normal user)</option>
                <option value="ADMIN">ADMIN (Platform administrator)</option>
                <option value="OWNER">OWNER (Store owner)</option>
              </select>
            </div>
          </div>
          <small className="help-text pass-hint">
            Password requirement: 8-16 characters, at least 1 uppercase letter, at least 1 special character.
          </small>

          <div className="form-group">
            <label>
              Address <span className="req">*</span>{' '}
              <span className="char-counter">({formData.address.length}/400)</span>
            </label>
            <textarea
              name="address"
              rows={3}
              className={`input-control ${errors.address ? 'input-error' : ''}`}
              placeholder="Full address (max 400 characters)"
              value={formData.address}
              onChange={handleChange}
              maxLength={400}
              required
            />
            {errors.address && <small className="error-text">{errors.address}</small>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Component to Add Store
function AddStoreModal({ potentialOwners, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: potentialOwners.length > 0 ? potentialOwners[0].id : '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errs = {};
    const nameErr = validateName(formData.name);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) errs.email = emailErr;

    const addrErr = validateAddress(formData.address);
    if (addrErr) errs.address = addrErr;

    if (!formData.ownerId) {
      errs.ownerId = 'Store owner is required';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);
      await api.adminCreateStore({
        name: formData.name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        ownerId: Number(formData.ownerId),
      });
      onSuccess(`Store "${formData.name.trim()}" created successfully!`);
    } catch (err) {
      setServerError(err.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Store</h3>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {serverError && <div className="alert alert-error">{serverError}</div>}

          <div className="form-group">
            <label>
              Store Name <span className="req">*</span>{' '}
              <span className="char-counter">({formData.name.length}/60)</span>
            </label>
            <input
              type="text"
              name="name"
              className={`input-control ${errors.name ? 'input-error' : ''}`}
              placeholder="Store name (20 to 60 characters)"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {errors.name && <small className="error-text">{errors.name}</small>}
            <small className="help-text">Must be between 20 and 60 characters.</small>
          </div>

          <div className="form-row">
            <div className="form-group col-half">
              <label>Store Email <span className="req">*</span></label>
              <input
                type="email"
                name="email"
                className={`input-control ${errors.email ? 'input-error' : ''}`}
                placeholder="store@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <small className="error-text">{errors.email}</small>}
            </div>

            <div className="form-group col-half">
              <label>Assign Store Owner <span className="req">*</span></label>
              <select
                name="ownerId"
                className="input-control"
                value={formData.ownerId}
                onChange={handleChange}
                required
              >
                {potentialOwners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email}) - {owner.role}
                  </option>
                ))}
              </select>
              <small className="help-text">
                Selected user will be assigned as store owner.
              </small>
            </div>
          </div>

          <div className="form-group">
            <label>
              Store Address <span className="req">*</span>{' '}
              <span className="char-counter">({formData.address.length}/400)</span>
            </label>
            <textarea
              name="address"
              rows={3}
              className={`input-control ${errors.address ? 'input-error' : ''}`}
              placeholder="Store address (max 400 characters)"
              value={formData.address}
              onChange={handleChange}
              maxLength={400}
              required
            />
            {errors.address && <small className="error-text">{errors.address}</small>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
