import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const MintAsset = ({ account, contract }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  const navigate = useNavigate();

  const handleMint = async (e) => {
    e.preventDefault();
    if (!account || !contract) {
      alert("Please connect wallet first!");
      return;
    }

    try {
      setIsMinting(true);
      setMintStatus('Uploading to IPFS via Pinata...');
      const metadata = {
        name,
        description,
        timestamp: new Date().toISOString(),
        issuer: account
      };

      // Upload to real IPFS via Pinata
      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `AssetVerifier-${name}`
          }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to upload to IPFS via Pinata');
      }

      const resData = await res.json();
      const tokenURI = `ipfs://${resData.IpfsHash}`;

      
      setMintStatus('Confirm Transaction in MetaMask...');
      
      // Force a lower gas limit and price to ensure it fits in their remaining 0.032 POL budget
      const tx = await contract.registerAsset(account, tokenURI, {
        gasLimit: 300000,
        maxFeePerGas: ethers.parseUnits("35", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("35", "gwei")
      });
      
      setMintStatus('Minting... Waiting for confirmation...');
      await tx.wait();
      
      setMintStatus('Asset successfully registered!');
      setTimeout(() => navigate('/'), 2000);
      
    } catch (error) {
      console.error(error);
      setMintStatus(`Error: ${error.message.substring(0, 50)}...`);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Register New Asset</h2>
      <p style={{ marginBottom: '2rem' }}>Tokenize your physical or digital asset on the blockchain.</p>
      
      <form onSubmit={handleMint}>
        <div className="form-group">
          <label className="form-label">Asset Name</label>
          <input 
            type="text" 
            className="form-input" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Rolex Submariner #12345"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Asset Description</label>
          <textarea 
            className="form-input" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Detailed description of the asset..."
            rows="4"
          />
        </div>

        <button type="submit" className="btn" style={{ width: '100%' }} disabled={isMinting}>
          {isMinting ? 'Processing...' : 'Register Asset'}
        </button>
        
        {mintStatus && (
          <div style={{ marginTop: '1rem', textAlign: 'center', color: mintStatus.includes('Error') ? '#f87171' : '#4ade80' }}>
            {mintStatus}
          </div>
        )}
      </form>
    </div>
  );
};

export default MintAsset;
