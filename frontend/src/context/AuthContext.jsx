import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractAddress from '../contracts/contract-address.json';
import AssetVerifierArtifact from '../contracts/AssetVerifier.json';

const AuthContext = createContext();

// Pre-configured developer credentials
const ADMIN_EMAIL = 'admin@assetverify.io';
const ADMIN_PASS = 'admin123';
// Default Hardhat local network deployer key mapping (Account #0)
const ADMIN_MOCK_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

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
    initAuth();
  }, []);

  // Update smart contract instance when account changes
  useEffect(() => {
    if (account && window.ethereum) {
      setupContract(account);
    }
  }, [account]);

  const setupContract = async (activeAccount) => {
    try {
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
      // Read-only fallback provider
      try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
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

        const calculatedRole = address.toLowerCase() === contractOwner.toLowerCase() ? 'admin' : 'user';
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
        const userData = {
          email: ADMIN_EMAIL,
          role: 'admin',
          address: ADMIN_MOCK_ADDRESS,
          isMetaMask: false
        };
        setUser(userData);
        setRole('admin');
        setAccount(ADMIN_MOCK_ADDRESS);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      } else if (email.toLowerCase() === USER_EMAIL && password === USER_PASS) {
        const userData = {
          email: USER_EMAIL,
          role: 'user',
          address: USER_MOCK_ADDRESS,
          isMetaMask: false
        };
        setUser(userData);
        setRole('user');
        setAccount(USER_MOCK_ADDRESS);
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
