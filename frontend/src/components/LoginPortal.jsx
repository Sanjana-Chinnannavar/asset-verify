import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Wallet, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

const LoginPortal = () => {
  const { loginWithCredentials, loginWithMetaMask, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'wallet'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await loginWithCredentials(email, password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
      setSubmitting(false);
    }
  };

  const handleMetaMaskSubmit = async () => {
    setError('');
    setSubmitting(true);
    const result = await loginWithMetaMask();
    if (!result.success) {
      setError(result.error || 'MetaMask connection failed');
      setSubmitting(false);
    }
  };

  const triggerQuickDemo = async (roleType) => {
    setError('');
    setSubmitting(true);
    let demoEmail = '';
    let demoPass = '';
    if (roleType === 'admin') {
      demoEmail = 'admin@assetverify.io';
      demoPass = 'admin123';
    } else {
      demoEmail = 'buyer@assetverify.io';
      demoPass = 'buyer123';
    }
    setEmail(demoEmail);
    setPassword(demoPass);
    const result = await loginWithCredentials(demoEmail, demoPass);
    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-pulse-glow bg-primary"></div>
      <div className="login-pulse-glow bg-secondary"></div>
      
      <div className="card login-card">
        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={48} className="logo-icon animate-float" />
          </div>
          <h1>AssetVerifier</h1>
          <p>Decentralized Asset Ownership & Provenance Portal</p>
        </div>

        {error && (
          <div className="status-badge status-error login-error">
            {error}
          </div>
        )}

        <div className="login-tabs">
          <button 
            className={`login-tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => { setActiveTab('credentials'); setError(''); }}
          >
            <Lock size={16} /> Portal Account
          </button>
          <button 
            className={`login-tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wallet'); setError(''); }}
          >
            <Wallet size={16} /> MetaMask Web3
          </button>
        </div>

        <div className="login-body">
          {activeTab === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-submit" disabled={submitting || loading}>
                {submitting ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
              </button>

              <div className="demo-bypass-section">
                <p className="demo-title">Quick Demo Login Bypass</p>
                <div className="demo-btn-grid">
                  <button 
                    type="button" 
                    className="btn btn-secondary demo-btn admin-demo"
                    onClick={() => triggerQuickDemo('admin')}
                    disabled={submitting}
                  >
                    <UserCheck size={16} /> Admin View
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary demo-btn user-demo"
                    onClick={() => triggerQuickDemo('user')}
                    disabled={submitting}
                  >
                    <UserCheck size={16} /> Buyer View
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="wallet-login-container">
              <p className="wallet-desc">
                Connect your decentralized MetaMask web3 wallet to instantly sign in and prove your identity.
              </p>
              
              <button 
                type="button" 
                className="btn btn-wallet"
                onClick={handleMetaMaskSubmit}
                disabled={submitting || loading}
              >
                <Wallet size={24} /> {submitting ? 'Connecting Wallet...' : 'Connect MetaMask'}
              </button>
              
              <div className="wallet-tip">
                <span className="bullet"></span> Auto-detects Admin role if you are the Smart Contract Owner.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPortal;
