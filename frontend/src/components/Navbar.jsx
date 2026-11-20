import React, { useState, useRef, useEffect } from 'react';

export default function Navbar({ user, onLogout, onOpenChangePassword }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-admin';
      case 'OWNER':
        return 'badge-owner';
      default:
        return 'badge-user';
    }
  };

  const getFirstName = (name) => {
    if (!name) return 'User';
    const clean = name.replace(/^(Store Owner|System Administrator)\s+/i, '').trim();
    return clean.split(/\s+/)[0] || 'User';
  };

  const firstName = getFirstName(user?.name);
  const avatarInitial = firstName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-icon">⭐</span>
          <span className="brand-title">Store Rating Portal</span>
        </div>

        {user && (
          <div className="navbar-profile-wrapper" ref={dropdownRef}>
            {/* 1. Single Profile button with user icon, first name, and dropdown arrow */}
            <button
              type="button"
              className={`navbar-profile-btn ${isOpen ? 'active' : ''}`}
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              title={`${user.name} (${user.role})`}
            >
              <span className="profile-btn-icon">👤</span>
              <span className="profile-btn-label">{firstName}</span>
              <span className={`profile-caret ${isOpen ? 'open' : ''}`}>▾</span>
            </button>

            {/* Profile Dropdown Menu */}
            {isOpen && (
              <div className="profile-dropdown-menu" role="menu">
                {/* 2. User's full name and role */}
                <div className="profile-dropdown-header">
                  <div className="dropdown-user-avatar">
                    {avatarInitial}
                  </div>
                  <div className="dropdown-user-details">
                    <span className="dropdown-user-name" title={user.name}>
                      {user.name}
                    </span>
                    {user.email && (
                      <span className="dropdown-user-email" title={user.email}>
                        {user.email}
                      </span>
                    )}
                    <div className="dropdown-badge-row">
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-actions">
                  {/* 3. Change Password inside dropdown */}
                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenChangePassword();
                    }}
                    role="menuitem"
                  >
                    <span className="dropdown-item-icon">🔑</span>
                    <span className="dropdown-item-text">Change Password</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  {/* 4. Logout inside dropdown */}
                  <button
                    type="button"
                    className="dropdown-item-btn dropdown-item-danger"
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    role="menuitem"
                  >
                    <span className="dropdown-item-icon">🚪</span>
                    <span className="dropdown-item-text">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
