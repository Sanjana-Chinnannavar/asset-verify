import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { Tag, ShoppingCart, User, Shield, ShieldCheck, Briefcase, Activity, Plus, RefreshCw, XCircle, Search, HelpCircle, CheckCircle, Watch, Home, Palette, Award } from 'lucide-react';

const Dashboard = () => {
  const { account, contract, role } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'marketplace' for users
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQrAsset, setActiveQrAsset] = useState(null);
  
  // Listing states
  const [listingPrices, setListingPrices] = useState({}); // { tokenId: price }
  const [actionLoading, setActionLoading] = useState(null); // tokenId being processed
  const [actionStatus, setActionStatus] = useState('');

  useEffect(() => {
    if (contract) {
      fetchAssets();
    } else {
      setLoading(false);
    }
  }, [contract, account]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const allAssets = [];
      
      // Query token IDs sequentially until we hit a revert (end of supply)
      for (let tokenId = 0; tokenId < 100; tokenId++) {
        try {
          // Execute all blockchain queries in parallel to drastically improve loading speeds
          const [owner, uri, listing] = await Promise.all([
            contract.ownerOf(tokenId),
            contract.tokenURI(tokenId),
            contract.listings(tokenId)
          ]);
          
          const isForSale = listing.isForSale;
          const price = ethers.formatEther(listing.price);
          const seller = listing.seller;

          let metadata = { 
            name: `Asset #${tokenId}`, 
            description: "Decentralized registered asset record.",
            assetClass: "unknown",
            specifications: {},
            image: "ipfs://QmUNLLsP2GmCwFMzUbz4QUtC8m8HgaCbfM7Qf7k1a32qXG" // default CID
          };
          
          try {
            if (uri.startsWith('ipfs://')) {
              const cid = uri.replace('ipfs://', '');
              if (cid.startsWith('eyJ')) {
                // Backward compatibility with base64 mocks
                metadata = JSON.parse(atob(cid));
              } else {
                const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
                if (res.ok) {
                  metadata = await res.json();
                }
              }
            }
          } catch (e) {
            console.error("Failed to parse metadata for token", tokenId, e);
          }
          
          allAssets.push({
            tokenId: tokenId.toString(),
            owner,
            uri,
            listing: { isForSale, price, seller },
            ...metadata
          });
        } catch (e) {
          // ownerOf reverts when token doesn't exist — indicates we hit the end of supply
          break;
        }
      }
      
      setAssets(allAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert IPFS URL to HTTP gateway
  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl) return 'https://placehold.co/600x400/2c3e50/ffffff?text=Asset';
    const cid = ipfsUrl.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  };

  const getVerifyUrl = (tokenId) => {
    const origin = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    return `${origin}/verify/${tokenId}`;
  };

  // On-chain: List Asset for Sale
  const handleListAsset = async (tokenId) => {
    const priceText = listingPrices[tokenId];
    if (!priceText || isNaN(priceText) || parseFloat(priceText) <= 0) {
      alert("Please enter a valid price in POL");
      return;
    }

    try {
      setActionLoading(tokenId);
      setActionStatus('Listing asset on-chain...');
      const priceWei = ethers.parseEther(priceText);
      
      let activeContract = contract;
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          if (network.chainId !== 80002n) {
            setActionStatus('Switching MetaMask to Polygon Amoy Testnet...');
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x13882' }],
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          const signer = await provider.getSigner();
          activeContract = contract.connect(signer);
        } catch (e) {
          console.warn("Failed to switch network or connect signer:", e);
        }
      }
      
      const tx = await activeContract.listAsset(tokenId, priceWei, {
        maxFeePerGas: ethers.parseUnits('30.01', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei')
      });
      setActionStatus('Waiting for transaction approval...');
      await tx.wait();
      
      setActionStatus('Asset listed successfully!');
      setTimeout(() => {
        setActionLoading(null);
        fetchAssets();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert(`Listing failed: ${error.message.substring(0, 60)}`);
      setActionLoading(null);
    }
  };

  // On-chain: Cancel Listing
  const handleCancelListing = async (tokenId) => {
    try {
      setActionLoading(tokenId);
      setActionStatus('Canceling marketplace listing...');
      
      let activeContract = contract;
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          if (network.chainId !== 80002n) {
            setActionStatus('Switching MetaMask to Polygon Amoy Testnet...');
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x13882' }],
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          const signer = await provider.getSigner();
          activeContract = contract.connect(signer);
        } catch (e) {
          console.warn("Failed to switch network or connect signer:", e);
        }
      }
      
      const tx = await activeContract.cancelListing(tokenId, {
        maxFeePerGas: ethers.parseUnits('30.01', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei')
      });
      setActionStatus('Confirming block transfer...');
      await tx.wait();
      
      setActionStatus('Listing canceled successfully!');
      setTimeout(() => {
        setActionLoading(null);
        fetchAssets();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert(`Cancellation failed: ${error.message.substring(0, 60)}`);
      setActionLoading(null);
    }
  };

  // On-chain: Purchase Asset
  const handlePurchaseAsset = async (asset) => {
    if (!account) {
      alert("Please connect wallet first!");
      return;
    }
    
    try {
      setActionLoading(asset.tokenId);
      setActionStatus(`Purchasing asset for ${asset.listing.price} POL...`);
      
      const priceWei = ethers.parseEther(asset.listing.price);
      
      let activeContract = contract;
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          if (network.chainId !== 80002n) {
            setActionStatus('Switching MetaMask to Polygon Amoy Testnet...');
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x13882' }],
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          const signer = await provider.getSigner();
          activeContract = contract.connect(signer);
        } catch (e) {
          console.warn("Failed to switch network or connect signer:", e);
        }
      }
      
      const tx = await activeContract.purchaseAsset(asset.tokenId, {
        value: priceWei,
        maxFeePerGas: ethers.parseUnits('30.01', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei')
      });
      
      setActionStatus('Signing cryptographic transfer... Please wait...');
      await tx.wait();
      
      setActionStatus('Purchase complete! Ownership updated on-chain!');
      setTimeout(() => {
        setActionLoading(null);
        fetchAssets();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert(`Purchase failed: ${error.message.substring(0, 60)}`);
      setActionLoading(null);
    }
  };

  // Filter assets based on search query
  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (asset.assetClass && asset.assetClass.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const myPortfolio = filteredAssets.filter(a => a.owner.toLowerCase() === account.toLowerCase());
  const marketplaceListings = filteredAssets.filter(a => a.listing.isForSale && a.owner.toLowerCase() !== account.toLowerCase());

  // Render Admin Dashboard
  if (role === 'admin') {
    return (
      <>
        <div className="admin-dashboard animate-fade-in">
        {/* Admin Dashboard Header Stats */}
        <div className="stats-row">
          <div className="card stat-card">
            <div className="stat-icon-box" style={{ background: '#3b82f620', color: '#3b82f6' }}>
              <Shield size={24} />
            </div>
            <div className="stat-content">
              <h3>{assets.length}</h3>
              <p>Total Registered Assets</p>
            </div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon-box" style={{ background: '#10b98120', color: '#10b981' }}>
              <Tag size={24} />
            </div>
            <div className="stat-content">
              <h3>{assets.filter(a => a.listing.isForSale).length}</h3>
              <p>Active Listings</p>
            </div>
          </div>

          <div className="card stat-card">
            <div className="stat-icon-box" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>
              <Activity size={24} />
            </div>
            <div className="stat-content">
              <h3>Active</h3>
              <p>Registry Health Node</p>
            </div>
          </div>
        </div>

        {/* Admin Control Actions */}
        <div className="admin-actions-split">
          <div className="card admin-registry-list">
            <div className="section-header-row">
              <div>
                <h2>Global Asset Ledger</h2>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                  Connected Contract: <span style={{ color: '#60a5fa' }}>{contract ? (contract.target || contract.address) : 'Loading...'}</span>
                </div>
              </div>
              <button onClick={fetchAssets} className="btn btn-secondary btn-sm" title="Sync Ledger">
                <RefreshCw size={16} /> Sync
              </button>
            </div>
            
            {loading ? (
              <div className="loading-state"><div className="spinner"></div><p>Synchronizing Ledger...</p></div>
            ) : filteredAssets.length === 0 ? (
              <p className="empty-text">No registered assets detected in this ledger epoch.</p>
            ) : (
              <div className="ledger-table-container">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Token ID</th>
                      <th>Asset Class</th>
                      <th>Asset Title</th>
                      <th>Ledger Owner</th>
                      <th>Marketplace Action</th>
                      <th>Verification & QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map(asset => (
                      <tr key={asset.tokenId}>
                        <td>#{asset.tokenId}</td>
                        <td>
                          <span className={`class-badge class-${asset.assetClass}`}>
                            {asset.assetClass.toUpperCase()}
                          </span>
                        </td>
                        <td><strong>{asset.name}</strong></td>
                        <td className="monospace-text">{asset.owner.substring(0, 8)}...{asset.owner.substring(asset.owner.length - 6)}</td>
                        
                        {/* Direct Marketplace Action Column */}
                        <td>
                          {asset.owner.toLowerCase() === account.toLowerCase() ? (
                            actionLoading === asset.tokenId ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                <div className="spinner mini-spinner"></div>
                                <span>{actionStatus}</span>
                              </div>
                            ) : asset.listing.isForSale ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ background: '#10b98120', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  {asset.listing.price} POL
                                </span>
                                <button 
                                  className="btn btn-logout btn-xs"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  onClick={() => handleCancelListing(asset.tokenId)}
                                >
                                  Cancel Sale
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input 
                                  type="number" 
                                  step="0.0001"
                                  placeholder="POL Price"
                                  style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', color: '#f8fafc' }}
                                  value={listingPrices[asset.tokenId] || ''}
                                  onChange={(e) => setListingPrices(prev => ({ ...prev, [asset.tokenId]: e.target.value }))}
                                />
                                <button 
                                  className="btn btn-primary btn-xs"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: '#8b5cf6', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                                  onClick={() => handleListAsset(asset.tokenId)}
                                >
                                  List
                                </button>
                              </div>
                            )
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>External Owner</span>
                          )}
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <Link to={`/verify/${asset.tokenId}`} className="btn-link">Verify Record</Link>
                            <button 
                              className="tooltip-qr-trigger"
                              onClick={() => setActiveQrAsset(asset)}
                              title="Show Cryptographic QR Code"
                              style={{ border: 'none', background: 'rgba(139, 92, 246, 0.12)', cursor: 'pointer' }}
                            >
                              Show QR
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card admin-side-panel">
            <h2>Administrative controls</h2>
            <p>Authorized administrator operations for authentic asset registration.</p>
            <div className="admin-shortcuts">
              <Link to="/mint" className="btn btn-primary shortcut-btn">
                <Plus size={20} /> Register New Asset
              </Link>
              <div className="admin-policy-alert">
                <Shield size={20} style={{ color: '#f59e0b' }} />
                <span><strong>Authenticity Guideline</strong>: Immutably anchoring an asset requires full verification of structural serial numbers and high-res media proofs.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Screen Blocker QR Modal */}
      {activeQrAsset && (
        <div className="qr-modal-overlay" onClick={() => setActiveQrAsset(null)}>
          <div className="qr-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setActiveQrAsset(null)}>
              <XCircle size={24} />
            </button>
            <div className="qr-modal-header">
              <ShieldCheck size={28} className="qr-modal-shield" />
              <h3>Ledger Provenance Pass</h3>
            </div>
            <p className="qr-modal-subtitle">{activeQrAsset.name} (Token #{activeQrAsset.tokenId})</p>
            <div className="qr-modal-body">
              <QRCodeSVG value={getVerifyUrl(activeQrAsset.tokenId)} size={210} className="modal-qr-svg" />
              <p className="qr-modal-hint">Scan with any smartphone camera to check public on-chain certificates and physical asset ownership instantly.</p>
            </div>
            <div className="qr-modal-actions">
              <Link to={`/verify/${activeQrAsset.tokenId}`} className="btn" onClick={() => setActiveQrAsset(null)}>
                View Verification Certificate
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

  // Render User/Buyer Dashboard
  return (
    <>
      <div className="user-dashboard animate-fade-in">
        <div style={{ background: '#1e293b80', border: '1px solid #334155', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
            Connected Contract: <span style={{ color: '#60a5fa' }}>{contract ? (contract.target || contract.address) : 'Loading...'}</span>
          </div>
          <button onClick={fetchAssets} className="btn btn-secondary btn-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <RefreshCw size={12} /> Sync Ledger
          </button>
        </div>
      {/* Search and Filters */}
      <div className="card search-filter-card">
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search registry by asset name, description, category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="user-tabs-row">
        <button 
          className={`user-tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          <Briefcase size={18} /> My Portfolio ({myPortfolio.length})
        </button>
        <button 
          className={`user-tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          <ShoppingCart size={18} /> Marketplace ({marketplaceListings.length})
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="loading-state card">
          <div className="spinner"></div>
          <p>Querying decentralized blockchain records...</p>
        </div>
      ) : activeTab === 'portfolio' ? (
        /* PORTFOLIO TAB */
        myPortfolio.length === 0 ? (
          <div className="card empty-portfolio-card">
            <User size={48} className="empty-icon" />
            <h3>Your Portfolio is Empty</h3>
            <p>You do not currently own any verified assets on this account. Purchase assets on the Marketplace tab or contact an Administrator for registration.</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {myPortfolio.map((asset) => (
              <div key={asset.tokenId} className="card asset-card">
                {/* Image Container */}
                <div className="asset-card-image-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30, 41, 59, 0.4)', minHeight: '180px', position: 'relative', overflow: 'hidden' }}>
                  {asset.image && asset.image !== 'ipfs://QmUNLLsP2GmCwFMzUbz4QUtC8m8HgaCbfM7Qf7k1a32qXG' ? (
                    <img src={getImageUrl(asset.image)} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: '#94a3b8', height: '100%', width: '100%', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
                      {(() => {
                        let Icon = ShieldCheck;
                        let color = '#3b82f6';
                        switch (asset.assetClass) {
                          case 'luxury': Icon = Watch; color = '#f59e0b'; break;
                          case 'realestate': Icon = Home; color = '#10b981'; break;
                          case 'fineart': Icon = Palette; color = '#8b5cf6'; break;
                          case 'digitalip': Icon = Award; color = '#3b82f6'; break;
                        }
                        return React.createElement(Icon, { size: 40, style: { color, marginBottom: '0.5rem', opacity: 0.8, filter: `drop-shadow(0 0 8px ${color}30)` } });
                      })()}
                      <span style={{ fontSize: '0.725rem', fontWeight: 'bold', color: '#f1f5f9', letterSpacing: '0.05em' }}>REGISTRY RECORD</span>
                    </div>
                  )}
                  <span className={`class-badge class-${asset.assetClass} card-floating-badge`}>
                    {asset.assetClass}
                  </span>
                </div>

                <div className="asset-card-details">
                  <h3>{asset.name}</h3>
                  <p className="desc-text">{asset.description.substring(0, 80)}...</p>

                  <div className="token-specs-summary">
                    <strong>Token ID:</strong> #{asset.tokenId}<br />
                    {Object.entries(asset.specifications || {}).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="mini-spec-tag">
                        <strong>{k}:</strong> {v}
                      </span>
                    ))}
                  </div>

                  {/* QR Code and Verification link */}
                  <div className="card-qr-box">
                    <QRCodeSVG value={getVerifyUrl(asset.tokenId)} size={90} className="card-qr-svg" />
                    <div className="qr-actions">
                      <p>Authenticity Check</p>
                      <Link to={`/verify/${asset.tokenId}`} className="btn btn-secondary btn-xs">
                        View Audit Certificate
                      </Link>
                    </div>
                  </div>

                  {/* Selling Form / On-Chain Marketplace listing controls */}
                  <div className="seller-listing-control">
                    {actionLoading === asset.tokenId ? (
                      <div className="action-processing-bar">
                        <div className="spinner mini-spinner"></div>
                        <span>{actionStatus}</span>
                      </div>
                    ) : asset.listing.isForSale ? (
                      <div className="active-listing-badge-box">
                        <div className="listing-info">
                          <span className="price-tag">{asset.listing.price} POL</span>
                          <span className="status-label">Active Marketplace Sale</span>
                        </div>
                        <button 
                          className="btn btn-logout btn-xs"
                          onClick={() => handleCancelListing(asset.tokenId)}
                        >
                          Cancel Sale
                        </button>
                      </div>
                    ) : (
                      <div className="sell-asset-form">
                        <input 
                          type="number" 
                          step="0.0001"
                          placeholder="Price in POL"
                          className="form-input price-input-mini"
                          value={listingPrices[asset.tokenId] || ''}
                          onChange={(e) => setListingPrices(prev => ({ ...prev, [asset.tokenId]: e.target.value }))}
                        />
                        <button 
                          className="btn btn-primary btn-xs sell-btn"
                          onClick={() => handleListAsset(asset.tokenId)}
                        >
                          List for Sale
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* MARKETPLACE TAB */
        marketplaceListings.length === 0 ? (
          <div className="card empty-portfolio-card">
            <ShoppingCart size={48} className="empty-icon" />
            <h3>No Active Marketplace Listings</h3>
            <p>There are no verified assets currently listed for sale by other users. Check back later!</p>
          </div>
        ) : (
          <div className="dashboard-grid animate-fade-in">
            {marketplaceListings.map((asset) => (
              <div key={asset.tokenId} className="card asset-card marketplace-item">
                <div className="asset-card-image-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30, 41, 59, 0.4)', minHeight: '180px', position: 'relative', overflow: 'hidden' }}>
                  {asset.image && asset.image !== 'ipfs://QmUNLLsP2GmCwFMzUbz4QUtC8m8HgaCbfM7Qf7k1a32qXG' ? (
                    <img src={getImageUrl(asset.image)} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', color: '#94a3b8', height: '100%', width: '100%', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
                      {(() => {
                        let Icon = ShieldCheck;
                        let color = '#3b82f6';
                        switch (asset.assetClass) {
                          case 'luxury': Icon = Watch; color = '#f59e0b'; break;
                          case 'realestate': Icon = Home; color = '#10b981'; break;
                          case 'fineart': Icon = Palette; color = '#8b5cf6'; break;
                          case 'digitalip': Icon = Award; color = '#3b82f6'; break;
                        }
                        return React.createElement(Icon, { size: 40, style: { color, marginBottom: '0.5rem', opacity: 0.8, filter: `drop-shadow(0 0 8px ${color}30)` } });
                      })()}
                      <span style={{ fontSize: '0.725rem', fontWeight: 'bold', color: '#f1f5f9', letterSpacing: '0.05em' }}>REGISTRY RECORD</span>
                    </div>
                  )}
                  <span className={`class-badge class-${asset.assetClass} card-floating-badge`}>
                    {asset.assetClass}
                  </span>
                  <div className="price-tag-floating">
                    {asset.listing.price} POL
                  </div>
                </div>

                <div className="asset-card-details">
                  <h3>{asset.name}</h3>
                  <p className="desc-text">{asset.description}</p>
                  
                  <div className="token-specs-summary">
                    <strong>Seller Address:</strong> <span className="monospace-text">{asset.listing.seller.substring(0, 10)}...</span><br/>
                    {Object.entries(asset.specifications || {}).map(([k, v]) => (
                      <span key={k} className="mini-spec-tag">
                        <strong>{k}:</strong> {v}
                      </span>
                    ))}
                  </div>

                  <div className="marketplace-buy-block">
                    {actionLoading === asset.tokenId ? (
                      <div className="action-processing-bar" style={{ width: '100%' }}>
                        <div className="spinner mini-spinner"></div>
                        <span>{actionStatus}</span>
                      </div>
                    ) : (
                      <>
                        <Link to={`/verify/${asset.tokenId}`} className="btn btn-secondary" style={{ flex: 1 }}>
                          Verify Specs
                        </Link>
                        <button 
                          className="btn btn-primary buy-now-btn"
                          onClick={() => handlePurchaseAsset(asset)}
                          style={{ flex: 2 }}
                        >
                          <ShoppingCart size={18} /> Buy Now
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      </div>
      
      {/* Screen Blocker QR Modal */}
      {activeQrAsset && (
        <div className="qr-modal-overlay" onClick={() => setActiveQrAsset(null)}>
          <div className="qr-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setActiveQrAsset(null)}>
              <XCircle size={24} />
            </button>
            <div className="qr-modal-header">
              <ShieldCheck size={28} className="qr-modal-shield" />
              <h3>Ledger Provenance Pass</h3>
            </div>
            <p className="qr-modal-subtitle">{activeQrAsset.name} (Token #{activeQrAsset.tokenId})</p>
            <div className="qr-modal-body">
              <QRCodeSVG value={getVerifyUrl(activeQrAsset.tokenId)} size={210} className="modal-qr-svg" />
              <p className="qr-modal-hint">Scan with any smartphone camera to check public on-chain certificates and physical asset ownership instantly.</p>
            </div>
            <div className="qr-modal-actions">
              <Link to={`/verify/${activeQrAsset.tokenId}`} className="btn" onClick={() => setActiveQrAsset(null)}>
                View Verification Certificate
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
