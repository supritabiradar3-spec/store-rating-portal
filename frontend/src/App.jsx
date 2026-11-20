import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChangePasswordModal from './components/ChangePasswordModal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import UserStoresPage from './pages/UserStoresPage';
import OwnerDashboard from './pages/OwnerDashboard';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);

  // Sync user state on changes
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAuthView('login');
  };

  // Render role-based page for authenticated users
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard currentUser={user} />;
      case 'OWNER':
        return <OwnerDashboard currentUser={user} />;
      case 'USER':
      default:
        return <UserStoresPage currentUser={user} />;
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePassOpen(true)}
      />

      <main className="main-content">
        {!user ? (
          authView === 'login' ? (
            <Login
              onLoginSuccess={handleLoginSuccess}
              onNavigateSignup={() => setAuthView('signup')}
            />
          ) : (
            <Signup
              onSignupSuccess={handleSignupSuccess}
              onNavigateLogin={() => setAuthView('login')}
            />
          )
        ) : (
          renderDashboard()
        )}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
        userEmail={user?.email}
      />
    </div>
  );
}
