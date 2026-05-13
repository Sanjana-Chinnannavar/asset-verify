# Blockchain-Based NFT System for Asset Ownership Verification

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [End-to-End Flow](#end-to-end-flow)
5. [Smart Contract Details](#smart-contract-details)
6. [Frontend Application](#frontend-application)
7. [IPFS Integration (Pinata)](#ipfs-integration-pinata)
8. [QR Code Verification System](#qr-code-verification-system)
9. [Deployment Pipeline](#deployment-pipeline)
10. [File Structure](#file-structure)

---

## Project Overview

This project is a **decentralized application (dApp)** that allows users to register physical or digital assets as Non-Fungible Tokens (NFTs) on the Polygon blockchain. Each asset receives a unique, immutable, and publicly verifiable record of ownership. A QR code is generated for every registered asset, enabling anyone with a smartphone to instantly verify the asset's authenticity and current owner — without needing a crypto wallet or any special software.

### Problem Statement
Counterfeit goods, duplicate digital assets, and fraudulent ownership claims are persistent challenges. Traditional verification systems rely on centralized databases that are vulnerable to:
- **Tampering**: A centralized admin can alter records.
- **Single Points of Failure**: If the server goes down, verification is impossible.
- **Opacity**: End-users cannot independently audit the records.

### Solution
By tokenizing assets on an immutable public blockchain and storing metadata on the decentralized IPFS network, this system ensures:
- **Tamper-proof records**: Once minted, ownership data cannot be altered or deleted.
- **Decentralized availability**: Data is replicated across thousands of global nodes.
- **Public verifiability**: Anyone can scan a QR code and cryptographically prove ownership.

---

## Technology Stack

| Layer            | Technology                     | Purpose                                                |
|------------------|-------------------------------|-------------------------------------------------------|
| Smart Contract   | Solidity v0.8.20              | ERC-721 NFT logic for minting and ownership tracking  |
| Contract Library | OpenZeppelin v5.x             | Audited, battle-tested ERC721URIStorage + Ownable     |
| Dev Framework    | Hardhat v3.x                  | Compilation, testing, and deployment of smart contracts|
| Blockchain       | Polygon Amoy Testnet          | Public EVM-compatible blockchain (Chain ID: 80002)    |
| Frontend         | React 18 + Vite 5             | Single Page Application with hot module replacement   |
| Styling          | Vanilla CSS                   | Glassmorphism aesthetic with CSS variables & animations|
| Web3 Bridge      | ethers.js v6                  | RPC communication between frontend and blockchain     |
| Wallet           | MetaMask                      | Transaction signing and account management            |
| Decentralized Storage | IPFS via Pinata API      | Permanent, content-addressed metadata storage         |
| QR Generation    | qrcode.react                  | SVG-based QR code rendering in the browser            |
| Icons            | Lucide React                  | Modern icon library for UI elements                   |
| Hosting          | Surge.sh                      | Static site hosting with global CDN                   |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐│
│  │  Dashboard   │   │  MintAsset   │   │   VerifyAsset        ││
│  │  (React)     │   │  (React)     │   │   (React)            ││
│  │              │   │              │   │                      ││
│  │ - Lists NFTs │   │ - Form input │   │ - Reads blockchain   ││
│  │ - QR codes   │   │ - IPFS upload│   │ - Fetches IPFS data  ││
│  │ - Event query│   │ - Mint tx    │   │ - No wallet needed   ││
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘│
│         │                  │                      │             │
└─────────┼──────────────────┼──────────────────────┼─────────────┘
          │                  │                      │
          │ queryFilter()    │ registerAsset()      │ ownerOf() / tokenURI()
          │                  │                      │
    ┌─────┴──────────────────┴──────────────────────┴──────┐
    │                    MetaMask Wallet                     │
    │            (Transaction Signing & Account Mgmt)        │
    └─────────────────────────┬────────────────────────────┘
                              │
                    JSON-RPC over HTTPS
                              │
    ┌─────────────────────────┴────────────────────────────┐
    │              Polygon Amoy Testnet                     │
    │           (Public EVM Blockchain)                     │
    │                                                       │
    │  ┌─────────────────────────────────────────────────┐  │
    │  │         AssetVerifier.sol (ERC-721)              │  │
    │  │                                                 │  │
    │  │  Storage:                                       │  │
    │  │  - _owners: mapping(tokenId => address)         │  │
    │  │  - _tokenURIs: mapping(tokenId => string)       │  │
    │  │  - _nextTokenId: uint256 (auto-increment)       │  │
    │  │                                                 │  │
    │  │  Functions:                                     │  │
    │  │  - registerAsset(to, uri) → tokenId             │  │
    │  │  - ownerOf(tokenId) → address                   │  │
    │  │  - tokenURI(tokenId) → string                   │  │
    │  │                                                 │  │
    │  │  Events:                                        │  │
    │  │  - AssetRegistered(tokenId, owner, uri)         │  │
    │  └─────────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────────┘
                              │
                   Stores only IPFS CID
                    (e.g., ipfs://Qm...)
                              │
    ┌─────────────────────────┴────────────────────────────┐
    │                  IPFS Network                         │
    │            (via Pinata Pinning Service)                │
    │                                                       │
    │  Stored JSON:                                         │
    │  {                                                    │
    │    "name": "Rolex Submariner #12345",                 │
    │    "description": "Authentic luxury watch...",        │
    │    "timestamp": "2026-05-13T14:00:00.000Z",           │
    │    "issuer": "0x26dc6B6C31E85F82eAD..."               │
    │  }                                                    │
    └──────────────────────────────────────────────────────┘
```

---

## End-to-End Flow

### Flow 1: Asset Registration (Minting)

```
User fills form → Upload JSON to IPFS → Get CID → Sign transaction in MetaMask
→ Smart contract mints NFT → Links CID to Token ID → Emits AssetRegistered event
→ Dashboard refreshes → QR code generated
```

**Step-by-step breakdown:**

1. **User Input**: The user enters an Asset Name and Description in the React form (`MintAsset.jsx`).

2. **IPFS Upload**: The frontend constructs a JSON metadata object containing:
   - `name`: The asset name
   - `description`: The asset description
   - `timestamp`: ISO 8601 registration time
   - `issuer`: The user's wallet address

   This JSON is sent via a `POST` request to Pinata's API endpoint (`https://api.pinata.cloud/pinning/pinJSONToIPFS`), authenticated using a JWT token stored in the frontend's `.env` file.

3. **CID Receipt**: Pinata distributes the JSON file across the IPFS network and returns a **Content Identifier (CID)** — a cryptographic hash that uniquely identifies the file. Example: `QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`.

4. **Transaction Construction**: The frontend formats the CID as an IPFS URI (`ipfs://Qm...`) and calls the smart contract's `registerAsset(address to, string uri)` function via `ethers.js`.

5. **MetaMask Signing**: MetaMask intercepts the transaction, displays gas costs to the user, and requests approval. Once the user clicks "Confirm", MetaMask signs the transaction with their private key.

6. **Blockchain Execution**: The signed transaction is broadcast to the Polygon Amoy network. The smart contract:
   - Increments `_nextTokenId` to generate a unique Token ID.
   - Calls `_safeMint(to, tokenId)` to create the NFT and assign ownership.
   - Calls `_setTokenURI(tokenId, uri)` to permanently link the IPFS CID to the token.
   - Emits an `AssetRegistered(tokenId, owner, uri)` event.

7. **Confirmation**: The frontend calls `tx.wait()` to wait for block confirmation. Once confirmed, it navigates the user back to the Dashboard.

8. **Dashboard Update**: The Dashboard component queries historical `AssetRegistered` events using `contract.queryFilter()`, filters them by the connected wallet address, and renders each asset with its decoded metadata and a dynamically generated QR code.

---

### Flow 2: QR Code Verification

```
Phone scans QR → Opens public URL → React app loads → Reads blockchain via public RPC
→ Gets owner + IPFS CID → Fetches metadata from IPFS Gateway → Displays verified result
```

**Step-by-step breakdown:**

1. **QR Scan**: A smartphone camera reads the QR code, which encodes a URL like `https://unique-attack.surge.sh/verify/1`.

2. **Page Load**: The phone's browser opens the URL. The React app loads from Surge's CDN. **No MetaMask or wallet is required.**

3. **Blockchain Read**: The `VerifyAsset.jsx` component creates a read-only connection to the Polygon Amoy network using a public RPC endpoint (`https://polygon-amoy.drpc.org`). It calls two read-only smart contract functions:
   - `ownerOf(tokenId)` → Returns the wallet address of the current owner.
   - `tokenURI(tokenId)` → Returns the IPFS URI (e.g., `ipfs://Qm...`).

4. **IPFS Fetch**: The component strips the CID from the URI and constructs a gateway URL (`https://gateway.pinata.cloud/ipfs/Qm...`). It performs a standard `fetch()` request to download the JSON metadata.

5. **Verification Display**: The page renders a green "Authentic Asset Verified" badge along with:
   - Asset Name and Description (from IPFS)
   - Current Owner's wallet address (from blockchain)
   - Registration timestamp (from IPFS metadata)
   - A link to the block explorer for independent audit

---

## Smart Contract Details

### `AssetVerifier.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AssetVerifier is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event AssetRegistered(uint256 indexed tokenId, address owner, string tokenURI);

    constructor() ERC721("AssetVerifier", "AVRF") Ownable(msg.sender) {}

    function registerAsset(address to, string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit AssetRegistered(tokenId, to, uri);
        return tokenId;
    }
}
```

**Key Design Decisions:**
- **ERC721URIStorage**: Extends the base ERC-721 with per-token URI storage, perfect for linking each NFT to its unique IPFS metadata.
- **Ownable**: Provides admin control (future use for access control).
- **Auto-incrementing Token IDs**: Uses `_nextTokenId++` for sequential, predictable token IDs.
- **Event Emission**: The `AssetRegistered` event serves as an on-chain index, allowing the frontend to efficiently query all registered assets without scanning every block.

### Deployed Contract
- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **Contract Address**: `0x6Ae4413f95D93D98Ebf4673a47e00C0EF635889D`
- **Explorer**: https://amoy.polygonscan.com/address/0x6Ae4413f95D93D98Ebf4673a47e00C0EF635889D

---

## Frontend Application

### Component Architecture

| Component        | Route           | Purpose                                   | Wallet Required? |
|-----------------|-----------------|-------------------------------------------|-------------------|
| `App.jsx`       | —               | Root layout, wallet connection, routing   | Yes (for write)   |
| `Dashboard.jsx` | `/`             | Lists user's assets, generates QR codes   | Yes               |
| `MintAsset.jsx` | `/mint`         | Registration form, IPFS upload, minting   | Yes               |
| `VerifyAsset.jsx`| `/verify/:tokenId` | Public verification page              | **No**            |

### Design System
- **Theme**: Dark mode with glassmorphism (frosted glass effects via `backdrop-filter: blur()`).
- **Color Palette**: Deep navy backgrounds (#0f172a), green accents (#4ade80), subtle gradients.
- **Animations**: Keyframe-based micro-animations for hover effects and loading states.
- **Typography**: System font stack with monospace for blockchain addresses.

---

## IPFS Integration (Pinata)

### Why IPFS?
Storing data directly on the blockchain is extremely expensive. A single string costs gas proportional to its byte length. IPFS solves this by storing the actual data off-chain and providing a short, cryptographic reference (CID) that is cheap to store on-chain.

### How Pinata Works
Pinata is a "pinning service" — it ensures your IPFS data remains available by keeping copies on dedicated nodes. Without pinning, IPFS data can be garbage-collected and become unavailable.

### Upload Flow
```javascript
// 1. Construct metadata
const metadata = { name, description, timestamp, issuer };

// 2. POST to Pinata API
const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`
  },
  body: JSON.stringify({
    pinataContent: metadata,
    pinataMetadata: { name: `AssetVerifier-${name}` }
  })
});

// 3. Get CID
const { IpfsHash } = await res.json();
// IpfsHash = "QmYwAPJzv5CZsnA625s3..."
```

### Retrieval Flow
```javascript
// 1. Read CID from blockchain
const uri = await contract.tokenURI(tokenId);
// uri = "ipfs://QmYwAPJzv5CZsnA625s3..."

// 2. Convert to gateway URL
const cid = uri.replace('ipfs://', '');
const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

// 3. Fetch JSON
const metadata = await fetch(gatewayUrl).then(r => r.json());
```

### Content Integrity
The CID is a cryptographic hash (SHA-256) of the file contents. If anyone modified the IPFS file, the hash would change completely, and the blockchain link would point to nothing. This guarantees **data integrity without a central authority**.

---

## QR Code Verification System

### Generation
Each asset on the Dashboard generates a QR code encoding the public verification URL:
```
https://unique-attack.surge.sh/verify/{tokenId}
```

### Scanning
When scanned:
1. The phone opens the URL in its default browser.
2. The React app loads from Surge's CDN.
3. `VerifyAsset.jsx` connects to the Polygon Amoy RPC (no wallet needed).
4. It reads the on-chain ownership and IPFS metadata.
5. Displays the verified result with a green checkmark.

### Security Properties
- **No wallet required**: Verification is read-only and uses a public RPC.
- **Tamper-proof**: The QR encodes a token ID; the actual data is read live from the blockchain.
- **Cross-device**: Works on any smartphone with a camera and browser.

---

## Deployment Pipeline

### 1. Smart Contract Deployment
```bash
cd backend
npx hardhat run scripts/deploy.js --network amoy
```
This compiles the Solidity contract, deploys it to the Polygon Amoy Testnet, and automatically exports the contract address and ABI to the frontend's `src/contracts/` directory.

### 2. Frontend Build
```bash
cd frontend
npm run build
```
Vite compiles, tree-shakes, and bundles the React app into optimized static files in the `dist/` directory.

### 3. Static Hosting
```bash
npx surge ./dist
```
Surge uploads the `dist/` folder to a global CDN, making it accessible at `https://unique-attack.surge.sh`.

---

## File Structure

```
Block_proj/
├── backend/
│   ├── contracts/
│   │   └── AssetVerifier.sol          # ERC-721 smart contract
│   ├── scripts/
│   │   └── deploy.js                  # Deployment script (exports ABI + address)
│   ├── hardhat.config.js              # Network configs (localhost, amoy)
│   ├── .env                           # PRIVATE_KEY (never committed to git)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx          # Asset listing + QR codes
│   │   │   ├── MintAsset.jsx          # Registration form + IPFS upload
│   │   │   └── VerifyAsset.jsx        # Public verification (no wallet needed)
│   │   ├── contracts/
│   │   │   ├── contract-address.json  # Auto-generated by deploy script
│   │   │   └── AssetVerifier.json     # Contract ABI (auto-generated)
│   │   ├── App.jsx                    # Root component + wallet connection
│   │   └── index.css                  # Glassmorphism design system
│   ├── .env                           # VITE_PINATA_JWT
│   ├── package.json
│   └── dist/                          # Production build (deployed to Surge)
│
└── PROJECT_EXPLANATION.md             # This file
```

---

## Security Considerations

| Concern                  | Mitigation                                                    |
|--------------------------|---------------------------------------------------------------|
| Private key exposure     | Stored in `.env` files, never committed to version control    |
| IPFS data tampering      | CID is a cryptographic hash; any change breaks the link       |
| Blockchain immutability  | Once minted, ownership records cannot be altered or deleted   |
| MetaMask phishing        | Users sign every transaction explicitly; no auto-approval     |
| API key leakage          | Pinata JWT is injected via Vite's `import.meta.env` at build time |

---

## Gas Economics

| Operation              | Approximate Cost         |
|------------------------|--------------------------|
| Contract Deployment    | ~0.068 POL               |
| Asset Registration     | ~0.005–0.01 POL          |
| Verification (Read)    | **Free** (read-only RPC) |
| IPFS Upload            | **Free** (Pinata free tier) |
