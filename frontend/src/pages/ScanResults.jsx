import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { ArrowDownTrayIcon, ShieldCheckIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const SEVERITY_CONFIG = {
  critical: { color: '#f87171', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)', label: 'CRITICAL', order: 0 },
  high: { color: '#fb923c', bg: 'rgba(234,88,12,0.08)', border: 'rgba(234,88,12,0.25)', label: 'HIGH', order: 1 },
  medium: { color: '#fbbf24', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', label: 'MEDIUM', order: 2 },
  low: { color: '#60a5fa', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.25)', label: 'LOW', order: 3 },
  info: { color: '#9ca3af', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)', label: 'INFO', order: 4 },
};

const OWASP_TOP_10 = [
  { id: 'A01:2021', name: 'Broken Access Control' },
  { id: 'A02:2021', name: 'Cryptographic Failures' },
  { id: 'A03:2021', name: 'Injection' },
  { id: 'A04:2021', name: 'Insecure Design' },
  { id: 'A05:2021', name: 'Security Misconfiguration' },
  { id: 'A06:2021', name: 'Vulnerable & Outdated Components' },
  { id: 'A07:2021', name: 'Identification & Auth Failures' },
  { id: 'A08:2021', name: 'Software & Data Integrity Failures' },
  { id: 'A09:2021', name: 'Security Logging Failures' },
  { id: 'A10:2021', name: 'Server-Side Request Forgery' },
];

function VulnCard({ vuln }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG.info;

  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', color: cfg.color, background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, flexShrink: 0 }}>
          {cfg.label}
        </span>
        <span style={{ flex: 1, color: '#f9fafb', fontSize: '14px', fontWeight: '600' }}>{vuln.title || vuln.type}</span>
        <span style={{ color: '#6b7280', fontSize: '12px', marginRight: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{vuln.owaspId}</span>
        {open ? <ChevronDownIcon style={{ width: '16px', height: '16px', color: '#6b7280', flexShrink: 0 }} /> : <ChevronRightIcon style={{ width: '16px', height: '16px', color: '#6b7280', flexShrink: 0 }} />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 20px', borderTop: `1px solid ${cfg.border}` }}>
          <div style={{ paddingTop: '16px', display: 'grid', gap: '12px' }}>
            {vuln.url && (
              <div>
                <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Affected URL</p>
                <p style={{ color: '#93c5fd', fontSize: '13px', wordBreak: 'break-all' }}>{vuln.url}</p>
              </div>
            )}
            <div>
              <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Description</p>
              <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.6' }}>{vuln.description}</p>
            </div>
            {vuln.evidence && (
              <div>
                <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Evidence</p>
                <code style={{ display: 'block', background: '#0f172a', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px 12px', color: '#fbbf24', fontSize: '12px', wordBreak: 'break-all' }}>{vuln.evidence}</code>
              </div>
            )}
            <div>
              <p style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Recommendation</p>
              <p style={{ color: '#86efac', fontSize: '13px', lineHeight: '1.6' }}>{vuln.recommendation}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                {vuln.owaspId} — {vuln.owaspCategory}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanResults() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingType, setDownloadingType] = useState('');

  useEffect(() => {
    api.get(`/scans/${id}`).then(res => setScan(res.data.scan)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>Loading results...</div>;
  if (!scan) return <div style={{ textAlign: 'center', padding: '80px', color: '#f87171' }}>Scan not found</div>;

  const vulns = [...(scan.vulnerabilities || [])].sort((a, b) => {
    const ao = SEVERITY_CONFIG[a.severity]?.order ?? 4;
    const bo = SEVERITY_CONFIG[b.severity]?.order ?? 4;
    return ao - bo;
  });

  const filtered = filter === 'all' ? vulns : vulns.filter(v => v.severity === filter);
  const summary = scan.summary || {};

  // OWASP mapping
  const owaspHits = new Set();
  vulns.forEach(v => { if (v.owaspId) owaspHits.add(v.owaspId); });

  const getFilenameFromDisposition = (disposition, fallback) => {
    if (!disposition) return fallback;
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
    const asciiMatch = disposition.match(/filename="([^"]+)"/i) || disposition.match(/filename=([^;]+)/i);
    return asciiMatch?.[1]?.trim() || fallback;
  };

  const downloadReport = async (type) => {
    setDownloadError('');
    setDownloadingType(type);

    try {
      const response = await api.get(`/scans/${id}/report/${type}`, {
        responseType: 'blob',
      });

      const contentType = response.headers['content-type']
        || (type === 'pdf' ? 'application/pdf' : 'application/json');
      const filename = getFilenameFromDisposition(
        response.headers['content-disposition'],
        `scan-report-${id}.${type}`
      );

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to download ${type} report:`, error);
      setDownloadError(`Failed to download ${type.toUpperCase()} report. Please try again.`);
    } finally {
      setDownloadingType('');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }} className="animate-fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ShieldCheckIcon style={{ width: '24px', height: '24px', color: '#22c55e' }} />
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#f9fafb' }}>Scan Results</h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Target: <span style={{ color: '#93c5fd' }}>{scan.url}</span>
            {' · '}{scan.urlsCrawled || 0} URLs crawled
            {' · '}{new Date(scan.completedAt).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => downloadReport('json')}
              disabled={downloadingType !== ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: '#1f2937',
                color: '#d1d5db',
                border: '1px solid #374151',
                borderRadius: '8px',
                cursor: downloadingType ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                opacity: downloadingType && downloadingType !== 'json' ? 0.7 : 1
              }}
            >
              <ArrowDownTrayIcon style={{ width: '15px', height: '15px' }} />
              {downloadingType === 'json' ? 'Downloading...' : 'JSON'}
            </button>
            <button
              onClick={() => downloadReport('pdf')}
              disabled={downloadingType !== ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: downloadingType ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                opacity: downloadingType && downloadingType !== 'pdf' ? 0.7 : 1
              }}
            >
              <ArrowDownTrayIcon style={{ width: '15px', height: '15px' }} />
              {downloadingType === 'pdf' ? 'Downloading...' : 'PDF Report'}
            </button>
          </div>
          {downloadError && (
            <p style={{ color: '#f87171', fontSize: '12px', margin: 0 }}>{downloadError}</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total', value: summary.total || 0, color: '#f9fafb', key: 'all' },
          { label: 'Critical', value: summary.critical || 0, color: '#f87171', key: 'critical' },
          { label: 'High', value: summary.high || 0, color: '#fb923c', key: 'high' },
          { label: 'Medium', value: summary.medium || 0, color: '#fbbf24', key: 'medium' },
          { label: 'Low', value: summary.low || 0, color: '#60a5fa', key: 'low' },
          { label: 'Info', value: summary.info || 0, color: '#9ca3af', key: 'info' },
        ].map(({ label, value, color, key }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            background: filter === key ? '#1f2937' : '#111827',
            border: filter === key ? '1px solid #374151' : '1px solid #1f2937',
            borderRadius: '10px', padding: '16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s'
          }}>
            <p style={{ fontSize: '26px', fontWeight: '800', color, marginBottom: '2px' }}>{value}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{label}</p>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Vulnerability List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f9fafb' }}>
              {filter === 'all' ? 'All Vulnerabilities' : `${filter.charAt(0).toUpperCase()+filter.slice(1)} Vulnerabilities`}
              <span style={{ color: '#6b7280', fontWeight: '400', fontSize: '14px', marginLeft: '8px' }}>({filtered.length})</span>
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <ShieldCheckIcon style={{ width: '40px', height: '40px', color: '#22c55e', margin: '0 auto 12px' }} />
              <p style={{ color: '#9ca3af', fontSize: '15px' }}>No {filter !== 'all' ? filter : ''} vulnerabilities found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map((v, i) => <VulnCard key={i} vuln={v} />)}
            </div>
          )}
        </div>

        {/* OWASP Top 10 Panel */}
        <div>
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '20px', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f9fafb', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheckIcon style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
              OWASP Top 10 (2021)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {OWASP_TOP_10.map(({ id, name }) => {
                const hit = owaspHits.has(id);
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: hit ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.04)', border: `1px solid ${hit ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)'}` }}>
                    {hit
                      ? <XCircleIcon style={{ width: '16px', height: '16px', color: '#f87171', flexShrink: 0 }} />
                      : <ShieldCheckIcon style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0 }} />
                    }
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>{id}</p>
                      <p style={{ fontSize: '12px', color: hit ? '#f9fafb' : '#6b7280', fontWeight: hit ? '600' : '400', lineHeight: '1.3' }}>{name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '16px', padding: '12px', background: '#0f172a', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Compliance Score</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: owaspHits.size === 0 ? '#22c55e' : owaspHits.size <= 3 ? '#fbbf24' : '#f87171' }}>
                {10 - owaspHits.size}/10
              </p>
              <p style={{ fontSize: '11px', color: '#4b5563' }}>categories clean</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <Link to="/dashboard" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>← Back to Dashboard</Link>
      </div>
    </div>
  );
}
