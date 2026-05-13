import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { Layers, ShieldCheck, Search } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MintAsset from './components/MintAsset';
import VerifyAsset from './components/VerifyAsset';

import contractAddress from './contracts/contract-address.json';
import AssetVerifierArtifact from './contracts/AssetVerifier.json';

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        console.log("No metamask found");
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setupContract();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setupContract();
    } catch (error) {
      console.error(error);
    }
  };

  const setupContract = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const verifierContract = new ethers.Contract(
        contractAddress.AssetVerifier,
        AssetVerifierArtifact.abi,
        signer
      );
      setContract(verifierContract);
    }
  };

  return (
    <Router>
      <div className="container">
        <header className="header">
          <Link to="/" className="logo">
            <ShieldCheck size={32} />
            AssetVerifier
          </Link>
          <nav className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/mint">Register Asset</Link>
          </nav>
          {account ? (
            <div className="status-badge status-success">
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </div>
          ) : (
            <button className="btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </header>

        <Routes>
          <Route path="/" element={<Dashboard account={account} contract={contract} />} />
          <Route path="/mint" element={<MintAsset account={account} contract={contract} />} />
          <Route path="/verify/:tokenId" element={<VerifyAsset />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
