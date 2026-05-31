import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Search, HelpCircle } from 'lucide-react';

const VerifySearch = () => {
  const [tokenId, setTokenId] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (tokenId.trim() === '') return;
    navigate(`/verify/${tokenId.trim()}`);
  };

  return (
    <div className="verify-search-wrapper animate-fade-in" style={{
      maxWidth: '520px',
      margin: '6rem auto',
      padding: '0 1rem'
    }}>
      <div className="card verify-search-card" style={{
        padding: '2.5rem',
        borderRadius: '16px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.4) 0%, rgba(9, 15, 34, 0.6) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)'
      }}>
        <div className="search-icon-shield" style={{
          display: 'inline-flex',
          padding: '1.25rem',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          color: '#3b82f6',
          marginBottom: '1.5rem',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)'
        }}>
          <ShieldCheck size={48} className="animate-pulse" />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f8fafc', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Verify Asset Authenticity
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Enter a registered asset token ID to search the Polygon ledger and instantly display its immutable provenance and custody records.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              min="0"
              placeholder="Enter Token ID (e.g. 0, 1, 2)"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem 0.85rem 2.75rem',
                fontSize: '1rem',
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                color: '#f8fafc',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                boxSizing: 'border-box'
              }}
            />
            <Search size={18} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#475569'
            }} />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
            }}
          >
            Audit Certificate
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '2rem',
          padding: '0.75rem',
          background: 'rgba(30, 41, 59, 0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.02)'
        }}>
          <HelpCircle size={16} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Token IDs are sequentially assigned starting from #0.
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerifySearch;
