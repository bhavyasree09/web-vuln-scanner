import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ShieldCheckIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function CheckItem({ label, done, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', opacity: done || active ? 1 : 0.4, transition: 'opacity 0.3s' }}>
      {done
        ? <CheckCircleIcon style={{ width: '18px', height: '18px', color: '#22c55e', flexShrink: 0 }} />
        : active
          ? <div style={{ width: '18px', height: '18px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          : <div style={{ width: '18px', height: '18px', border: '2px solid #374151', borderRadius: '50%', flexShrink: 0 }} />
      }
      <span style={{ fontSize: '14px', color: done ? '#22c55e' : active ? '#93c5fd' : '#6b7280', fontWeight: active ? '600' : '400' }}>{label}</span>
    </div>
  );
}

const CHECK_LABELS = [
  'Crawling website',
  'Security Headers',
  'Cookie Security',
  'Clickjacking',
  'Sensitive Files',
  'Directory Listing',
  'Open Redirect',
  'CSRF Detection',
  'XSS Detection',
  'SQL Injection',
  'Generating report',
];

export default function ScanProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await api.get(`/api/scans/${id}`);
        setScan(res.data.scan);
        if (res.data.scan.status === 'completed') {
          setTimeout(() => navigate(`/scan/${id}/results`), 1200);
        } else if (res.data.scan.status === 'failed') {
          setError(res.data.scan.errorMessage || 'Scan failed');
        }
      } catch {
        setError('Could not fetch scan status');
      }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const progress = scan?.progress || 0;
  const currentCheck = scan?.currentCheck || 'Initializing...';

  // Determine which checks are done/active
  const checkProgress = CHECK_LABELS.map((label, i) => {
    const threshold = (i + 1) / CHECK_LABELS.length * 100;
    return {
      label,
      done: progress >= threshold,
      active: progress >= (i / CHECK_LABELS.length * 100) && progress < threshold
    };
  });

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }} className="animate-fade-in-up">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#f9fafb', marginBottom: '6px' }}>Scanning in Progress</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Target: <span style={{ color: '#93c5fd' }}>{scan?.url || '...'}</span>
        </p>
      </div>

      {error ? (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <XCircleIcon style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
          <p style={{ color: '#f87171', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Scan Failed</p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{error}</p>
          <button onClick={() => navigate('/scan/new')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Try Again</button>
        </div>
      ) : (
        <>
          {/* Progress Bar Card */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '28px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MagnifyingGlassIcon style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
                <span style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: '600' }}>{currentCheck}</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {progress}%
              </span>
            </div>

            {/* Main progress bar */}
            <div style={{ height: '10px', background: '#1f2937', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{
                height: '100%', width: `${progress}%`, borderRadius: '5px',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                transition: 'width 0.6s ease',
                boxShadow: '0 0 12px rgba(59,130,246,0.5)'
              }} />
            </div>

            {scan?.urlsCrawled > 0 && (
              <p style={{ color: '#6b7280', fontSize: '12px' }}>{scan.urlsCrawled} URLs crawled</p>
            )}
          </div>

          {/* Checks list */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Security Checks
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap:'0 24px' }}>
              {checkProgress.map(c => <CheckItem key={c.label} {...c} />)}
            </div>
          </div>

          {progress === 100 && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '14px 24px', color: '#22c55e', fontWeight: '600' }}>
                <CheckCircleIcon style={{ width: '20px', height: '20px' }} />
                Scan complete! Redirecting to results...
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
