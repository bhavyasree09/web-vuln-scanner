import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { GlobeAltIcon, ShieldExclamationIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function NewScan() {
  const [url, setUrl] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return;
    // Validate URL
    try {
      const u = new URL(url.startsWith('http') ? url : `http://${url}`);
    } catch {
      setError('Please enter a valid URL'); return;
    }
    setError('');
    setShowDisclaimer(true);
  };

  const startScan = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      const finalUrl = url.startsWith('http') ? url : `http://${url}`;
      const res = await api.post('/scans', { url: finalUrl });
      navigate(`/scan/${res.data.scanId}/progress`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start scan');
      setShowDisclaimer(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }} className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#f9fafb', marginBottom: '8px' }}>New Security Scan</h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Enter a target URL to begin automated vulnerability scanning</p>
      </div>

      {/* Scan Card */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', color: '#e5e7eb', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            Target URL
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <GlobeAltIcon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
              <input
                type="text" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                style={{ width: '100%', padding: '13px 16px 13px 46px', background: '#1f2937', border: '1px solid #374151', borderRadius: '10px', color: '#f9fafb', fontSize: '15px', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = '#374151'}
                required
              />
            </div>
            <button type="submit" style={{ padding: '13px 28px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Start Scan
            </button>
          </div>
          {error && <p style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
        </form>
      </div>

      {/* What We Check */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f9fafb', marginBottom: '16px' }}>Vulnerability Checks Performed</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            ['SQL Injection', 'critical'],
            ['Cross-Site Scripting (XSS)', 'high'],
            ['CSRF Detection', 'high'],
            ['Open Redirect', 'medium'],
            ['Missing Security Headers', 'medium'],
            ['Directory Listing', 'medium'],
            ['Sensitive File Exposure', 'high'],
            ['Insecure Cookies', 'medium'],
            ['Clickjacking', 'medium'],
          ].map(([name, sev]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircleIcon style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#d1d5db' }}>{name}</span>
              <span className={`badge-${sev}`} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{sev}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px', backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in-up" style={{ background: '#111827', border: '1px solid #374151', borderRadius: '20px', padding: '32px', maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(234,88,12,0.15)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(234,88,12,0.3)' }}>
                <ExclamationTriangleIcon style={{ width: '24px', height: '24px', color: '#fb923c' }} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f9fafb' }}>Ethical Scanning Disclaimer</h2>
            </div>

            <div style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.7', marginBottom: '24px' }}>
              <p style={{ marginBottom: '12px' }}>By proceeding, you confirm that:</p>
              {[
                'You have explicit permission to scan the target: ' + (url.startsWith('http') ? url : `http://${url}`),
                'You are the owner of the target system, or have written authorization from the owner',
                'You understand that unauthorized scanning may be illegal in your jurisdiction',
                'This tool is for educational and authorized security testing only',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '24px', padding: '14px', background: accepted ? 'rgba(34,197,94,0.08)' : '#1f2937', border: `1px solid ${accepted ? 'rgba(34,197,94,0.3)' : '#374151'}`, borderRadius: '10px', transition: 'all 0.2s' }}>
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <span style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '500' }}>I have authorization to scan this target and accept responsibility</span>
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowDisclaimer(false); setAccepted(false); }} style={{ flex: 1, padding: '12px', background: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>
                Cancel
              </button>
              <button onClick={startScan} disabled={!accepted || loading} style={{ flex: 1, padding: '12px', background: accepted ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#374151', color: accepted ? '#fff' : '#6b7280', border: 'none', borderRadius: '10px', cursor: accepted ? 'pointer' : 'not-allowed', fontWeight: '600', transition: 'all 0.2s' }}>
                {loading ? 'Starting...' : 'Begin Scan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
