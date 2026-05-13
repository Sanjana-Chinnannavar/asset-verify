import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

const Dashboard = ({ account, contract }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contract && account) {
      fetchAssets();
    } else {
      setLoading(false);
    }
  }, [contract, account]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const userAssets = [];
      
      // Instead of unreliable event queries on public RPCs,
      // we directly iterate through token IDs and check ownership.
      // We try token IDs 0, 1, 2, ... until we hit one that doesn't exist.
      for (let tokenId = 0; tokenId < 100; tokenId++) {
        try {
          const owner = await contract.ownerOf(tokenId);
          
          // Check if this token belongs to the connected user
          if (owner.toLowerCase() === account.toLowerCase()) {
            const uri = await contract.tokenURI(tokenId);
            let metadata = { name: "Unknown Asset", description: "No metadata found" };
            
            try {
              if (uri.startsWith('ipfs://')) {
                const cid = uri.replace('ipfs://', '');
                if (cid.startsWith('eyJ')) {
                  metadata = JSON.parse(atob(cid));
                } else {
                  const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
                  metadata = await res.json();
                }
              }
            } catch (e) {
              console.error("Failed to parse metadata for token", tokenId, e);
            }
            
            userAssets.push({
              tokenId: tokenId.toString(),
              uri,
              ...metadata
            });
          }
        } catch (e) {
          // ownerOf reverts when token doesn't exist — this means we've reached the end
          break;
        }
      }
      
      setAssets(userAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVerifyUrl = (tokenId) => {
    return `${window.location.origin}/verify/${tokenId}`;
  };

  if (!account) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Welcome to AssetVerifier</h2>
        <p>Please connect your wallet to view your registered assets.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Your Assets</h2>
        <Link to="/mint" className="btn btn-secondary">Register New</Link>
      </div>
      
      {loading ? (
        <p>Loading your assets...</p>
      ) : assets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>You haven't registered any assets yet.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {assets.map((asset) => (
            <div key={asset.tokenId} className="card">
              <h3>{asset.name}</h3>
              <p style={{ marginBottom: '1rem' }}>{asset.description}</p>
              <div style={{ fontSize: '0.875rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.25rem' }}>
                <strong>Token ID:</strong> {asset.tokenId}<br/>
                <strong>URI:</strong> {asset.uri.substring(0, 20)}...
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Verification QR Code</p>
                <div className="qr-container">
                  <QRCodeSVG value={getVerifyUrl(asset.tokenId)} size={150} />
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Link to={`/verify/${asset.tokenId}`} className="btn btn-secondary" style={{ width: '100%' }}>
                    View Public Record
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
