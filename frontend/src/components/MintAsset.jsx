import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';
import { Watch, Home, Palette, Award, FileUp, Sparkles, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, FileText } from 'lucide-react';

const MintAsset = () => {
  const { account, contract } = useAuth();
  const [step, setStep] = useState(1); // 1: Class, 2: Specs, 3: Image, 4: Summary/Mint
  const [assetClass, setAssetClass] = useState(''); // 'luxury', 'realestate', 'fineart', 'digitalip'
  
  // Specification states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState({});
  
  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageIpfsUrl, setImageIpfsUrl] = useState('');
  
  // Custom Document Proof states
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docIpfsUrl, setDocIpfsUrl] = useState('');
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const navigate = useNavigate();

  // Pre-configured asset types
  const assetClasses = [
    {
      id: 'luxury',
      title: 'Luxury Goods',
      desc: 'Tokenize high-end watches, designer handbags, or fine jewelry.',
      icon: Watch,
      color: '#f59e0b'
    },
    {
      id: 'realestate',
      title: 'Real Estate & Deeds',
      desc: 'Tokenize land titles, property deeds, or apartment shares.',
      icon: Home,
      color: '#10b981'
    },
    {
      id: 'fineart',
      title: 'Fine Art & Collectibles',
      desc: 'Tokenize physical paintings, sculptures, or rare museum pieces.',
      icon: Palette,
      color: '#8b5cf6'
    },
    {
      id: 'digitalip',
      title: 'Intellectual Property',
      desc: 'Tokenize patents, software copyright, or trade secrets.',
      icon: Award,
      color: '#3b82f6'
    }
  ];

  const handleClassSelect = (classId) => {
    setAssetClass(classId);
    setSpecs({}); // Reset specs
    setStep(2);
  };

  const handleSpecChange = (key, value) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  };

  // Upload raw image file to Pinata IPFS
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    
    try {
      setIsUploadingImage(true);
      setStatusMessage('Uploading high-res asset image to IPFS...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: formData
      });
      
      if (!res.ok) {
        throw new Error('Failed to upload image file to Pinata IPFS');
      }
      
      const resData = await res.json();
      const ipfsUrl = `ipfs://${resData.IpfsHash}`;
      setImageIpfsUrl(ipfsUrl);
      setStatusMessage('Image successfully anchored on decentralized IPFS!');
    } catch (error) {
      console.error(error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getDocProofLabel = () => {
    switch (assetClass) {
      case 'luxury':
        return 'Authenticity Certificate (PDF/Invoice)';
      case 'realestate':
        return 'Government Registry Deed (PDF)';
      case 'fineart':
        return 'Certificate of Authenticity (COA) (PDF)';
      case 'digitalip':
        return 'Official Registry Deed / Patent Document (PDF)';
      default:
        return 'Official Authenticity Document (PDF)';
    }
  };

  const handleDocFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setDocFile(file);
    setDocName(file.name);
    
    try {
      setIsUploadingDoc(true);
      setStatusMessage(`Uploading ${getDocProofLabel()} to IPFS...`);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: formData
      });
      
      if (!res.ok) {
        throw new Error('Failed to upload document file to Pinata IPFS');
      }
      
      const resData = await res.json();
      const ipfsUrl = `ipfs://${resData.IpfsHash}`;
      setDocIpfsUrl(ipfsUrl);
      setStatusMessage('Official registry document successfully anchored on decentralized IPFS!');
    } catch (error) {
      console.error(error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!account || !contract) {
      alert("Please connect wallet first!");
      return;
    }

    try {
      setIsMinting(true);
      setStatusMessage('Pinning structured asset metadata to IPFS...');

      // Combine general attributes with asset-class specific specs
      const metadata = {
        name,
        description,
        assetClass,
        specifications: specs,
        image: imageIpfsUrl || 'ipfs://QmUNLLsP2GmCwFMzUbz4QUtC8m8HgaCbfM7Qf7k1a32qXG', // fallback image CID
        documentProof: docIpfsUrl || '',
        documentName: docName || '',
        timestamp: new Date().toISOString(),
        issuer: account
      };

      // Upload metadata JSON to Pinata
      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `AssetVerifier-${assetClass}-${name}`
          }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to upload metadata to IPFS via Pinata');
      }

      const resData = await res.json();
      const tokenURI = `ipfs://${resData.IpfsHash}`;

      setStatusMessage('Confirming smart contract registration on Polygon Ledger...');
      
      // Call registerAsset (Restricted to contract owner/admin)
      const tx = await contract.registerAsset(account, tokenURI);
      
      setStatusMessage('Registering asset on-chain... Waiting for block confirmation...');
      await tx.wait();
      
      setStatusMessage('Success! Asset tokenized and verified on the blockchain!');
      setTimeout(() => navigate('/'), 2000);
      
    } catch (error) {
      console.error(error);
      setStatusMessage(`Error: ${error.message.substring(0, 80)}...`);
    } finally {
      setIsMinting(false);
    }
  };

  // Render spec form inputs dynamically based on class selected
  const renderSpecFields = () => {
    switch (assetClass) {
      case 'luxury':
        return (
          <>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Brand / Manufacturer</label>
                <input type="text" className="form-input" placeholder="e.g. Rolex, Patek Philippe" onChange={(e) => handleSpecChange('brand', e.target.value)} value={specs.brand || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Model Name / Number</label>
                <input type="text" className="form-input" placeholder="e.g. Daytona 116500LN" onChange={(e) => handleSpecChange('model', e.target.value)} value={specs.model || ''} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Unique Serial Number</label>
                <input type="text" className="form-input" placeholder="e.g. RX88219A9" onChange={(e) => handleSpecChange('serial', e.target.value)} value={specs.serial || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Year of Manufacture</label>
                <input type="number" className="form-input" placeholder="e.g. 2024" onChange={(e) => handleSpecChange('year', e.target.value)} value={specs.year || ''} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Case/Frame Material</label>
                <input type="text" className="form-input" placeholder="e.g. Oystersteel, 18k Rose Gold" onChange={(e) => handleSpecChange('material', e.target.value)} value={specs.material || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Condition Grade</label>
                <select className="form-input" onChange={(e) => handleSpecChange('condition', e.target.value)} value={specs.condition || 'New'}>
                  <option value="New">New / Unworn</option>
                  <option value="Excellent">Excellent / Mint</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good / Signs of Wear</option>
                </select>
              </div>
            </div>
          </>
        );
      case 'realestate':
        return (
          <>
            <div className="form-group">
              <label className="form-label">Property Absolute Address</label>
              <input type="text" className="form-input" placeholder="e.g. 742 Evergreen Terrace, Springfield" onChange={(e) => handleSpecChange('address', e.target.value)} value={specs.address || ''} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Property registry / Deed ID</label>
                <input type="text" className="form-input" placeholder="e.g. DEED-9921-A8" onChange={(e) => handleSpecChange('deedId', e.target.value)} value={specs.deedId || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Square Footage / Area</label>
                <input type="text" className="form-input" placeholder="e.g. 2,400 sq ft" onChange={(e) => handleSpecChange('area', e.target.value)} value={specs.area || ''} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select className="form-input" onChange={(e) => handleSpecChange('propertyType', e.target.value)} value={specs.propertyType || 'Residential'}>
                  <option value="Residential">Residential (House/Apartment)</option>
                  <option value="Commercial">Commercial (Office/Shop)</option>
                  <option value="Industrial">Industrial (Warehouse)</option>
                  <option value="Land">Vacant Land Plot</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year of Construction</label>
                <input type="number" className="form-input" placeholder="e.g. 1998" onChange={(e) => handleSpecChange('yearBuilt', e.target.value)} value={specs.yearBuilt || ''} />
              </div>
            </div>
          </>
        );
      case 'fineart':
        return (
          <>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Artist / Creator Name</label>
                <input type="text" className="form-input" placeholder="e.g. Vincent van Gogh" onChange={(e) => handleSpecChange('artist', e.target.value)} value={specs.artist || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Creation Year</label>
                <input type="text" className="form-input" placeholder="e.g. 1889" onChange={(e) => handleSpecChange('creationYear', e.target.value)} value={specs.creationYear || ''} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Medium Used</label>
                <input type="text" className="form-input" placeholder="e.g. Oil on Canvas, Marble Sculpture" onChange={(e) => handleSpecChange('medium', e.target.value)} value={specs.medium || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Dimensions (H x W x D)</label>
                <input type="text" className="form-input" placeholder="e.g. 73.7 cm × 92.1 cm" onChange={(e) => handleSpecChange('dimensions', e.target.value)} value={specs.dimensions || ''} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Certificate of Authenticity (COA) ID</label>
              <input type="text" className="form-input" placeholder="e.g. COA-ART-1102" onChange={(e) => handleSpecChange('coaId', e.target.value)} value={specs.coaId || ''} required />
            </div>
          </>
        );
      case 'digitalip':
        return (
          <>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">IP Classification</label>
                <select className="form-input" onChange={(e) => handleSpecChange('ipType', e.target.value)} value={specs.ipType || 'Patent'}>
                  <option value="Patent">Patent Deed</option>
                  <option value="Trademark">Registered Trademark</option>
                  <option value="Copyright">Copyright Registration</option>
                  <option value="SourceCode">Source Code Proprietary License</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Official Registry ID</label>
                <input type="text" className="form-input" placeholder="e.g. US-PAT-104928" onChange={(e) => handleSpecChange('registryId', e.target.value)} value={specs.registryId || ''} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Registration / Filing Date</label>
                <input type="date" className="form-input" onChange={(e) => handleSpecChange('filingDate', e.target.value)} value={specs.filingDate || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Registry Office / Jurisdiction</label>
                <input type="text" className="form-input" placeholder="e.g. USPTO, EUIPO" onChange={(e) => handleSpecChange('jurisdiction', e.target.value)} value={specs.jurisdiction || ''} required />
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card wizard-card animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
      {/* Wizard Header Progress Bar */}
      <div className="wizard-progress-bar-container">
        <div className="wizard-progress" style={{ width: `${(step / 4) * 100}%` }}></div>
        <div className="wizard-steps-indicators">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`wizard-step-node ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Choose Class */}
      {step === 1 && (
        <div>
          <div className="wizard-section-header">
            <h2>Select Verified Asset Classification</h2>
            <p>Define the categorical framework of the asset to structure its on-chain specifications.</p>
          </div>
          
          <div className="classes-grid">
            {assetClasses.map(c => {
              const Icon = c.icon;
              return (
                <div 
                  key={c.id} 
                  className={`class-select-card ${assetClass === c.id ? 'active' : ''}`}
                  onClick={() => handleClassSelect(c.id)}
                  style={{ '--hover-color': c.color }}
                >
                  <div className="class-icon-wrapper" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                    <Icon size={28} />
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Form Input */}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
          <div className="wizard-section-header">
            <button type="button" className="btn-back" onClick={() => setStep(1)}><ArrowLeft size={16} /> Classification</button>
            <h2>Asset Profile & Technical Specs</h2>
            <p>Provide verified details about this asset. This information will be saved immutably on IPFS.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Asset Public Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Patek Philippe Aquanaut #5167A" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ownership Summary / Context</label>
            <textarea 
              className="form-input" 
              placeholder="Provide a comprehensive narrative or proven description of authenticity..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows="3"
              required 
            />
          </div>

          <div className="specs-fields-box">
            <h4 className="specs-subheading">{assetClasses.find(c => c.id === assetClass)?.title} Specifics</h4>
            {renderSpecFields()}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn">
              Next Step: Upload Media <ArrowRight size={18} />
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Dual Media Upload (Showcase Photo + Official Document Proof) */}
      {step === 3 && (
        <div>
          <div className="wizard-section-header">
            <button type="button" className="btn-back" onClick={() => setStep(2)}><ArrowLeft size={16} /> Specifications</button>
            <h2>Cryptographic Proof & Document Verification</h2>
            <p>For maximum authenticity, attach a high-fidelity visual showcase photo AND the official regulatory document proof (like a COA, land deed, or patent filing).</p>
          </div>

          <div className="upload-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
            {/* Column 1: Image Showcase */}
            <div className="upload-column">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="#f59e0b" /> Visual Proof (Showcase Photo)
              </h3>
              <div className="upload-zone-box" style={{ height: '230px', position: 'relative' }}>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="file-hidden" 
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isUploadingImage}
                />
                
                {!imagePreview ? (
                  <label htmlFor="file-upload" className="upload-label-placeholder" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                    <FileUp size={36} className="upload-placeholder-icon" style={{ margin: '0 auto 0.5rem auto' }} />
                    <span style={{ fontSize: '0.85rem' }}>Choose asset photo</span>
                    <span className="file-hint" style={{ fontSize: '0.7rem' }}>JPG, PNG, WEBP (Max 5MB)</span>
                  </label>
                ) : (
                  <div className="upload-preview-container" style={{ height: '100%', position: 'relative' }}>
                    <img src={imagePreview} className="upload-preview-img" alt="Asset Preview" style={{ maxHeight: '100%', objectFit: 'contain', width: '100%' }} />
                    {isUploadingImage ? (
                      <div className="upload-loading-overlay" style={{ background: 'rgba(15,23,42,0.85)' }}>
                        <div className="spinner"></div>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Pinning Image to IPFS...</p>
                      </div>
                    ) : (
                      <div className="upload-success-overlay" style={{ background: 'rgba(15,23,42,0.8)' }}>
                        <Sparkles size={20} color="#4ade80" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>IPFS Anchored!</span>
                        <label htmlFor="file-upload" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Change Photo</label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Document Proof */}
            <div className="upload-column">
              <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color="#3b82f6" /> {getDocProofLabel().split(' (')[0]}
              </h3>
              <div className="upload-zone-box" style={{ height: '230px', position: 'relative' }}>
                <input 
                  type="file" 
                  id="doc-upload" 
                  className="file-hidden" 
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleDocFileChange}
                  disabled={isUploadingDoc}
                />
                
                {!docName ? (
                  <label htmlFor="doc-upload" className="upload-label-placeholder" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                    <FileText size={36} className="upload-placeholder-icon" style={{ color: '#64748b', margin: '0 auto 0.5rem auto' }} />
                    <span style={{ fontSize: '0.85rem' }}>Upload Official PDF Proof</span>
                    <span className="file-hint" style={{ fontSize: '0.7rem' }}>PDF, DOCX (Max 10MB)</span>
                  </label>
                ) : (
                  <div className="upload-preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center', height: '100%' }}>
                    <FileText size={42} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.8rem', color: '#f8fafc', wordBreak: 'break-all', fontWeight: 'bold', maxWidth: '90%', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{docName}</span>
                    {isUploadingDoc ? (
                      <div className="upload-loading-overlay" style={{ background: 'rgba(15,23,42,0.85)' }}>
                        <div className="spinner"></div>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Pinning PDF to IPFS...</p>
                      </div>
                    ) : (
                      <div className="upload-success-overlay" style={{ background: 'rgba(15,23,42,0.8)' }}>
                        <Sparkles size={20} color="#4ade80" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Document Pinned!</span>
                        <label htmlFor="doc-upload" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Change File</label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className={`status-bar-mint ${statusMessage.includes('Error') ? 'error' : 'success'}`} style={{ marginTop: '1.5rem' }}>
              <AlertCircle size={16} /> {statusMessage}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button 
              type="button" 
              className="btn" 
              onClick={() => setStep(4)} 
              disabled={isUploadingImage || isUploadingDoc || (!imageIpfsUrl && !docIpfsUrl)}
            >
              Review Verification <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review and Submit */}
      {step === 4 && (
        <div>
          <div className="wizard-section-header">
            <button type="button" className="btn-back" onClick={() => setStep(3)}><ArrowLeft size={16} /> Media</button>
            <h2>Cryptographic Ledger Summary</h2>
            <p>Review the compiled structural parameters. Once minted, these attributes are unalterable.</p>
          </div>

          <div className="summary-layout">
            <div className="summary-photo-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              {imagePreview ? (
                <img src={imagePreview} alt="Summary asset" className="summary-img" />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: '220px',
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: `2px dashed ${assetClasses.find(c => c.id === assetClass)?.color}40`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  color: '#94a3b8',
                  boxShadow: 'inset 0 4px 30px rgba(0, 0, 0, 0.2)'
                }}>
                  {React.createElement(assetClasses.find(c => c.id === assetClass)?.icon || ShieldCheck, {
                    size: 44,
                    style: { color: assetClasses.find(c => c.id === assetClass)?.color, marginBottom: '0.75rem', opacity: 0.8 }
                  })}
                  <span style={{ fontSize: '0.825rem', fontWeight: 'bold', color: '#f1f5f9', letterSpacing: '0.05em' }}>REGISTRY RECORD ONLY</span>
                  <span style={{ fontSize: '0.675rem', textAlign: 'center', marginTop: '0.35rem', color: '#64748b', lineHeight: '1.4' }}>
                    No photo attached. Pinned official document will serve as primary custody proof.
                  </span>
                </div>
              )}
              <div className="summary-class-pill" style={{ borderColor: assetClasses.find(c => c.id === assetClass)?.color, marginTop: '1rem', width: 'fit-content' }}>
                {assetClasses.find(c => c.id === assetClass)?.title}
              </div>
            </div>

            <div className="summary-specs-list">
              <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{name}</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>{description}</p>
              
              <div className="summary-grid-fields">
                {Object.entries(specs).map(([key, val]) => (
                  <div key={key} className="summary-field-row">
                    <span className="field-label">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</span>
                    <span className="field-value">{val}</span>
                  </div>
                ))}
                {imageIpfsUrl && (
                  <div className="summary-field-row">
                    <span className="field-label">IPFS IMAGE HASH:</span>
                    <span className="field-value code-font">{imageIpfsUrl.substring(0, 18)}...</span>
                  </div>
                )}
                {docIpfsUrl && (
                  <div className="summary-field-row">
                    <span className="field-label">VERIFIED DOC PROOF:</span>
                    <span className="field-value code-font" style={{ color: '#3b82f6' }}>{docName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className={`status-bar-mint ${statusMessage.includes('Error') ? 'error' : statusMessage.includes('Success') ? 'success' : 'processing'}`}>
              <AlertCircle size={16} /> {statusMessage}
            </div>
          )}

          <div className="mint-cta-block">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setStep(3)}
              disabled={isMinting}
            >
              Edit Details
            </button>
            
            <button 
              type="button" 
              className="btn btn-mint-confirm animate-pulse" 
              onClick={handleMint}
              disabled={isMinting}
            >
              <ShieldCheck size={20} /> {isMinting ? 'Writing to Ledger...' : 'Confirm and Mint Asset'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MintAsset;
