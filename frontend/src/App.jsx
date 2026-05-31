import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShieldCheck, LogOut, LayoutDashboard, FilePlus } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MintAsset from './components/MintAsset';
import VerifyAsset from './components/VerifyAsset';
import LoginPortal from './components/LoginPortal';
import VerifySearch from './components/VerifySearch';

function AppContent() {
  const { user, role, account, logout, loading } = useAuth();
  const location = useLocation();

  // Allow public access to the verify route without logging in
  const isVerifyRoute = location.pathname.startsWith('/verify/');

  if (loading) {
    return (
      <div className="system-loading">
        <div className="spinner"></div>
        <h2>Initializing Secure Cryptographic Node...</h2>
        <p>Connecting to Polygon Ledger</p>
      </div>
    );
  }

  // If not logged in and not on the verify route, show the login portal
  if (!user && !isVerifyRoute) {
    return <LoginPortal />;
  }

  return (
    <div className="container">
      {!isVerifyRoute && (
        <header className="header">
          <Link to="/" className="logo">
            <ShieldCheck size={32} />
            AssetVerifier <span className="logo-badge">{role === 'admin' ? 'Admin Portal' : 'Buyer Hub'}</span>
          </Link>
          <nav className="nav-links">
            <Link to="/" className="nav-item">
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link to="/verify-search" className="nav-item">
              <ShieldCheck size={18} /> Verify Asset
            </Link>
            {role === 'admin' && (
              <Link to="/mint" className="nav-item">
                <FilePlus size={18} /> Register Asset
              </Link>
            )}
          </nav>
          
          <div className="header-actions">
            <div className="status-badge-container">
              <span className={`role-tag ${role === 'admin' ? 'role-admin' : 'role-user'}`}>
                {role === 'admin' ? 'SYSTEM ADMIN' : 'AUTHORIZED BUYER'}
              </span>
              {account && (
                <div className="status-badge status-success">
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </div>
              )}
            </div>
            
            <button className="btn btn-secondary btn-logout" onClick={logout} title="Sign Out">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route 
          path="/mint" 
          element={role === 'admin' ? <MintAsset /> : <Navigate to="/" replace />} 
        />
        <Route path="/verify-search" element={<VerifySearch />} />
        <Route path="/verify/:tokenId" element={<VerifyAsset />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
