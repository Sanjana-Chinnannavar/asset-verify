import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractAddress from '../contracts/contract-address.json';
import AssetVerifierArtifact from '../contracts/AssetVerifier.json';

const AuthContext = createContext();

// Pre-configured developer credentials
const ADMIN_EMAIL = 'admin@assetverify.io';
const ADMIN_PASS = 'admin123';
// Live production admin wallet address
const ADMIN_MOCK_ADDRESS = '0x26dc6B6C31E85F82eAD03d1a6d44eB3A31c18A8c';

const USER_EMAIL = 'buyer@assetverify.io';
const USER_PASS = 'buyer123';
// Default Hardhat local network secondary account mapping (Account #1)
const USER_MOCK_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'user' | null
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setRole(parsed.role);
          setAccount(parsed.address);
        }
        
        // Auto-check if MetaMask is already connected
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const activeAcc = accounts[0];
            
            // Check if there was no custom credentials user logged in, or if it matches
            if (!storedUser) {
              setAccount(activeAcc);
              // Setup contract to detect role
              await detectMetaMaskRole(activeAcc);
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };
    // Listen to network and account changes dynamically
    if (window.ethereum) {
      const handleChainChanged = () => window.location.reload();
      const handleAccountsChanged = () => {
        localStorage.removeItem('auth_user'); // Clear cached auth to force fresh detection
        window.location.reload();
      };
      
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      initAuth();
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    } else {
      initAuth();
    }
  }, []);

  // Update smart contract instance when account changes
  useEffect(() => {
    if (account && window.ethereum) {
      setupContract(account);
    }
  }, [account]);

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }], // 80002 (Polygon Amoy Testnet)
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'POL',
                  symbol: 'POL',
                  decimals: 18,
                },
                rpcUrls: ['https://polygon-amoy.drpc.org'],
                blockExplorerUrls: ['https://amoy.polygonscan.com'],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Amoy network:", addError);
        }
      }
    }
  };

  const setupContract = async (activeAccount) => {
    try {
      // Force switch MetaMask network to Polygon Amoy Testnet to prevent network desync reverts
      await switchNetwork();
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const verifierContract = new ethers.Contract(
        contractAddress.AssetVerifier,
        AssetVerifierArtifact.abi,
        signer
      );
      setContract(verifierContract);
      return verifierContract;
    } catch (e) {
      console.error("Failed to setup contract inside auth:", e);
      // Read-only fallback provider pointing to Polygon Amoy Testnet
      try {
        const provider = new ethers.JsonRpcProvider("https://polygon-amoy.drpc.org");
        const verifierContract = new ethers.Contract(
          contractAddress.AssetVerifier,
          AssetVerifierArtifact.abi,
          provider
        );
        setContract(verifierContract);
        return verifierContract;
      } catch (err) {
        console.error("RPC fallback failed:", err);
      }
    }
  };

  const detectMetaMaskRole = async (address) => {
    try {
      const tempContract = await setupContract(address);
      if (tempContract) {
        let contractOwner = ADMIN_MOCK_ADDRESS; // fallback
        try {
          contractOwner = await tempContract.owner();
        } catch (e) {
          console.warn("Could not read contract owner, using default mock:", e);
        }

        const calculatedRole = (address.toLowerCase() === contractOwner.toLowerCase() || address.toLowerCase() === '0x26dc6b6c31e85f82ead03d1a6d44eb3a31c18a8c') ? 'admin' : 'user';
        const userData = {
          email: calculatedRole === 'admin' ? ADMIN_EMAIL : 'metamask.user@assetverify.io',
          role: calculatedRole,
          address: address,
          isMetaMask: true
        };
        setUser(userData);
        setRole(calculatedRole);
        setAccount(address);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Detect role failed:", error);
    }
  };

  const loginWithCredentials = async (email, password) => {
    setLoading(true);
    try {
      if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASS) {
        let activeAddress = ADMIN_MOCK_ADDRESS;
        
        // Actively request MetaMask account access to bind real signer address
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
              activeAddress = accounts[0];
            }
          } catch (e) {
            console.warn("Could not connect MetaMask account, using mock:", e);
          }
        }

        const userData = {
          email: ADMIN_EMAIL,
          role: 'admin',
          address: activeAddress,
          isMetaMask: false
        };
        setUser(userData);
        setRole('admin');
        setAccount(activeAddress);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      } else if (email.toLowerCase() === USER_EMAIL && password === USER_PASS) {
        let activeAddress = USER_MOCK_ADDRESS;
        
        // Actively request MetaMask account access to bind real signer address
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
              activeAddress = accounts[0];
            }
          } catch (e) {
            console.warn("Could not connect MetaMask account, using mock:", e);
          }
        }

        const userData = {
          email: USER_EMAIL,
          role: 'user',
          address: activeAddress,
          isMetaMask: false
        };
        setUser(userData);
        setRole('user');
        setAccount(activeAddress);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithMetaMask = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it!");
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setAccount(address);
      await detectMetaMaskRole(address);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccount(null);
    setRole(null);
    setContract(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      account,
      role,
      contract,
      loading,
      loginWithCredentials,
      loginWithMetaMask,
      logout,
      setupContract
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
