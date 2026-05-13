import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

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
      // For verification, we don't need the user to be connected
      // We can use a read-only provider if they don't have MetaMask
      // But since we are using Localhost Hardhat, we'll try to use window.ethereum first
      
      // For public verification, we strictly use the Polygon Amoy public RPC.
      // This allows anyone scanning the QR code on a mobile phone to read the data,
      // even if they don't have MetaMask installed!
      const provider = new ethers.JsonRpcProvider("https://polygon-amoy.drpc.org");

      const contract = new ethers.Contract(
        contractAddress.AssetVerifier,
        AssetVerifierArtifact.abi,
        provider
      );

      // Fetch owner and URI
      const owner = await contract.ownerOf(tokenId);
      const uri = await contract.tokenURI(tokenId);
      
      let metadata = { name: "Unknown", description: "Could not decode metadata" };
      
      try {
        if (uri.startsWith('ipfs://')) {
          const cid = uri.replace('ipfs://', '');
          if (cid.startsWith('eyJ')) {
            // It's our old mock base64
            metadata = JSON.parse(atob(cid));
          } else {
            // It's a real IPFS CID, fetch from Pinata gateway
            const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
            metadata = await res.json();
          }
        }
      } catch (e) {
        console.error("Failed to decode mock CID", e);
      }

      setAssetData({
        owner,
        uri,
        ...metadata
      });

    } catch (err) {
      console.error(err);
      setError("Asset not found or invalid Token ID.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card" style={{ textAlign: 'center' }}><h2>Verifying Blockchain Record...</h2></div>;
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', borderColor: '#ef4444' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2>Verification Failed</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '2rem' }}>Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <ShieldCheck size={40} color="#4ade80" />
        <div>
          <h2 style={{ marginBottom: '0' }}>Authentic Asset Verified</h2>
          <p style={{ color: '#4ade80' }}>Blockchain record found for Token #{tokenId}</p>
        </div>
      </div>
      
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
          Asset Details
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ color: '#94a3b8' }}>Asset Name:</div>
          <div style={{ fontWeight: '600' }}>{assetData?.name}</div>
          
          <div style={{ color: '#94a3b8' }}>Description:</div>
          <div>{assetData?.description}</div>
          
          <div style={{ color: '#94a3b8' }}>Current Owner:</div>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
            {assetData?.owner}
          </div>
          
          <div style={{ color: '#94a3b8' }}>IPFS Metadata:</div>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {assetData?.uri}
          </div>
          
          {assetData?.timestamp && (
            <>
              <div style={{ color: '#94a3b8' }}>Registration Date:</div>
              <div>{new Date(assetData.timestamp).toLocaleString()}</div>
            </>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <a href={`https://amoy.polygonscan.com/`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          View on Block Explorer <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

export default VerifyAsset;
