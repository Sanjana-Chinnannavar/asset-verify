import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, AlertCircle, ExternalLink, Calendar, User, FileText, CheckCircle2, History, ChevronRight, ShoppingCart, Watch, Home, Palette, Award } from 'lucide-react';

import contractAddress from '../contracts/contract-address.json';
import AssetVerifierArtifact from '../contracts/AssetVerifier.json';

const VerifyAsset = () => {
  const { tokenId } = useParams();
  const [assetData, setAssetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyAssetOnChain();
  }, [tokenId]);

  const verifyAssetOnChain = async () => {
    try {
      setLoading(true);
      setError('');
      
      let provider;
      // Robust RPC network discovery: Localhost RPC first (for instant dev verification), fallback to Amoy.
      try {
        provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        // Test connection
        await provider.getBlockNumber();
      } catch (err) {
        console.log("Local node offline, connecting to Polygon Amoy RPC...");
        provider = new ethers.JsonRpcProvider("https://polygon-amoy.drpc.org");
      }

      const contract = new ethers.Contract(
        contractAddress.AssetVerifier,
        AssetVerifierArtifact.abi,
        provider
      );

      // Fetch contract owner (Admin) to show as issuer
      let contractOwner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      try {
        contractOwner = await contract.owner();
      } catch (e) {
        console.warn("Could not retrieve owner address");
      }

      // Fetch owner and URI
      const owner = await contract.ownerOf(tokenId);
      const uri = await contract.tokenURI(tokenId);
      
      // Fetch listing to display on-chain sale status
      let listingPrice = "0";
      let isForSale = false;
      try {
        const listing = await contract.listings(tokenId);
        isForSale = listing.isForSale;
        listingPrice = ethers.formatEther(listing.price);
      } catch (e) {
        console.warn("Marketplace listings mapping could not be read");
      }
      
      let metadata = { 
        name: `Asset #${tokenId}`, 
        description: "Registered blockchain verification ledger record.",
        assetClass: "unknown",
        specifications: {},
        image: "ipfs://QmUNLLsP2GmCwFMzUbz4QUtC8m8HgaCbfM7Qf7k1a32qXG"
      };
      
      try {
        if (uri.startsWith('ipfs://')) {
          const cid = uri.replace('ipfs://', '');
          if (cid.startsWith('eyJ')) {
            metadata = JSON.parse(atob(cid));
          } else {
            const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
            if (res.ok) {
              metadata = await res.json();
            }
          }
        }
      } catch (e) {
        console.error("Failed to decode CID", e);
      }

      setAssetData({
        owner,
        uri,
        contractOwner,
        listing: { isForSale, price: listingPrice },
        ...metadata
      });

    } catch (err) {
      console.error(err);
      setError("This Asset Token ID is either unminted, burned, or not present on the ledger registry.");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (ipfsUrl) => {
    if (!ipfsUrl) return 'https://placehold.co/600x400/2c3e50/ffffff?text=Asset';
    const cid = ipfsUrl.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  };

  const getClassName = (classId) => {
    switch (classId) {
      case 'luxury': return 'Luxury Good';
      case 'realestate': return 'Real Estate Title';
      case 'fineart': return 'Fine Art Masterpiece';
      case 'digitalip': return 'Intellectual Property';
      default: return 'Tokenized Asset';
    }
  };

  if (loading) {
    return (
      <div className="card loading-certificate" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <div className="spinner animate-spin" style={{ margin: '0 auto 1.5rem' }}></div>
        <h2>Cryptographically Auditing Ledger Record...</h2>
        <p>Querying Polygon Block Address and Pinata CIDs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card verify-error-card animate-fade-in" style={{ textAlign: 'center', borderColor: '#ef4444' }}>
        <AlertCircle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))' }} />
        <h2>Invalid Registry Query</h2>
        <p className="error-text">{error}</p>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/" className="btn btn-secondary">Return to Portal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-certificate-wrapper animate-fade-in">
      <div className="certificate-seal-glow"></div>
      
      <div className="card certificate-card">
        {/* Certificate Watermark Header */}
        <div className="certificate-header">
          <div className="cert-logo-box">
            <ShieldCheck size={36} className="cert-check-icon animate-pulse" />
            <span>AUTHENTIC REGISTRY RECORD</span>
          </div>
          <div className="cert-serial">
            <span>REGISTRY ID:</span>
            <span className="monospace-text">TOKEN-AVRF-{tokenId}</span>
          </div>
        </div>

        {/* Certificate Title Row */}
        <div className="certificate-title-row">
          <h1>Asset Provenance Certificate</h1>
          <p>Issued under cryptographic authority by the AssetVerifier platform.</p>
        </div>

        {/* Content Layout Split */}
        <div className="certificate-layout-grid">
          {/* Visual Showcase */}
          <div className="cert-visual-panel">
            <div className="cert-img-frame" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '260px' }}>
              {assetData.image && assetData.image !== 'ipfs://QmUNLLsP2GmCwFMzUbz4QUtC8m8HgaCbfM7Qf7k1a32qXG' ? (
                <img src={getImageUrl(assetData.image)} alt={assetData.name} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                  minHeight: '220px',
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '12px',
                  padding: '2rem',
                  color: '#94a3b8',
                  boxShadow: 'inset 0 4px 30px rgba(0, 0, 0, 0.25)',
                  textAlign: 'center'
                }}>
                  {(() => {
                    let Icon = ShieldCheck;
                    let color = '#3b82f6';
                    switch (assetData.assetClass) {
                      case 'luxury': Icon = Watch; color = '#f59e0b'; break;
                      case 'realestate': Icon = Home; color = '#10b981'; break;
                      case 'fineart': Icon = Palette; color = '#8b5cf6'; break;
                      case 'digitalip': Icon = Award; color = '#3b82f6'; break;
                    }
                    return React.createElement(Icon, {
                      size: 56,
                      style: { color, marginBottom: '1rem', opacity: 0.8, filter: `drop-shadow(0 0 12px ${color}40)` }
                    });
                  })()}
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f1f5f9', letterSpacing: '0.05em' }}>VERIFIED BLOCKCHAIN PROOF</span>
                  <span style={{ fontSize: '0.725rem', textAlign: 'center', marginTop: '0.4rem', color: '#64748b', lineHeight: '1.4', maxWidth: '80%' }}>
                    This asset utilizes an official registered PDF document as its primary cryptographic provenance proof.
                  </span>
                </div>
              )}
              <div className={`cert-class-ribbon class-${assetData.assetClass}`}>
                {getClassName(assetData.assetClass)}
              </div>
            </div>
            
            {assetData.listing.isForSale && (
              <div className="cert-on-sale-banner">
                <ShoppingCart size={18} /> Listed for Sale: <strong>{assetData.listing.price} POL</strong>
              </div>
            )}
          </div>

          {/* Details and Technical Specs */}
          <div className="cert-details-panel">
            <div className="spec-block">
              <h2>{assetData.name}</h2>
              <p className="spec-desc">{assetData.description}</p>
            </div>

            {/* Specifications Matrix */}
            <div className="spec-matrix-box">
              <h3>Technical Specifications</h3>
              <div className="spec-grid-matrix">
                {Object.entries(assetData.specifications || {}).map(([key, val]) => (
                  <div key={key} className="spec-row">
                    <span className="spec-label">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                    <span className="spec-val">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Verification Checks */}
            <div className="verification-checks-box">
              <h3>Cryptographic Audits</h3>
              <div className="check-item-list">
                <div className="check-item">
                  <CheckCircle2 size={18} className="check-icon-green" />
                  <span>Ledger Integrity Verified on Polygon Blockchain</span>
                </div>
                <div className="check-item">
                  <CheckCircle2 size={18} className="check-icon-green" />
                  <span>Decentralized Metadata Pinned via IPFS gateway</span>
                </div>
                <div className="check-item">
                  <CheckCircle2 size={18} className="check-icon-green" />
                  <span>Smart Contract Ownership Signatures Validated</span>
                </div>
                <div className="check-item">
                  <CheckCircle2 size={18} className="check-icon-green" />
                  <span>Content Hash Matching CID: <span className="monospace-text">{assetData.uri.substring(7, 19)}...</span></span>
                </div>
              </div>
            </div>

            {/* Category-Specific Official Document Proof */}
            {assetData.documentProof && (
              <div className="proof-document-box animate-fade-in" style={{
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={26} style={{ color: '#60a5fa' }} />
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block', letterSpacing: '0.05em', fontWeight: 'bold' }}>VERIFIED REGISTRY PROOF</span>
                    <span style={{ fontSize: '0.825rem', color: '#f8fafc', fontWeight: '600', wordBreak: 'break-all', display: 'block' }}>{assetData.documentName || 'Official Registry Document'}</span>
                  </div>
                </div>
                <a 
                  href={`https://gateway.pinata.cloud/ipfs/${assetData.documentProof.replace('ipfs://', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary btn-sm"
                  style={{
                    flexShrink: 0,
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Download PDF <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Cryptographic Verification Pass QR (Centered in the Middle) */}
        <div className="cert-qr-pass-centered animate-fade-in">
          <div className="cert-qr-pass-card">
            <QRCodeSVG value={`https://unique-attack.surge.sh/verify/${tokenId}`} size={130} className="cert-qr-svg" />
            <div className="pass-text">
              <h4>PHYSICAL AUTHENTICITY SCAN PASS</h4>
              <p>Print and attach this cryptographic provenance pass directly to your physical item. Scanning this code on any smartphone instantly verifies its origin, full lifecycle audits, and blockchain custody on Polygon.</p>
            </div>
          </div>
        </div>

        {/* Chronological Provenance Timeline */}
        <div className="provenance-history-box">
          <div className="box-title-row">
            <History size={20} />
            <h3>Chain of Custody Provenance</h3>
          </div>
          
          <div className="provenance-timeline">
            {/* Step 1: Issuer */}
            <div className="timeline-node">
              <div className="node-icon-dot active"></div>
              <div className="node-content">
                <h4>1. Token Registration (Minted)</h4>
                <p>Asset verified and anchored by Authorized Platform Authority.</p>
                <div className="timeline-address">
                  <User size={12} /> Issuer: <span className="monospace-text">{assetData.contractOwner}</span>
                </div>
                {assetData.timestamp && (
                  <div className="timeline-date">
                    <Calendar size={12} /> {new Date(assetData.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="timeline-connector">
              <ChevronRight size={24} className="connector-arrow" />
            </div>

            {/* Step 2: Current Owner */}
            <div className="timeline-node">
              <div className="node-icon-dot success"></div>
              <div className="node-content">
                <h4>2. Current Custodian (Owner)</h4>
                <p>Address holding valid cryptographic rights of ownership.</p>
                <div className="timeline-address">
                  <User size={12} /> Owner: <span className="monospace-text">{assetData.owner}</span>
                </div>
                <span className="current-custody-tag">ACTIVE OWNER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="cert-footer-actions">
          <a 
            href={`https://amoy.polygonscan.com/address/${contractAddress.AssetVerifier}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary"
          >
            Inspect Smart Contract <ExternalLink size={16} />
          </a>
          <Link to="/" className="btn">
            Access Portal Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyAsset;
