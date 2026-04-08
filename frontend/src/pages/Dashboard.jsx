import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { ShieldExclamationIcon, ClockIcon, CheckCircleIcon, XCircleIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  queued: '#6b7280',
  running: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444'
};

const STATUS_ICONS = {
  queued: <ClockIcon style={{ width: '16px', height: '16px' }} />,
  running: <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', animation: 'pulse-glow 1.5s infinite' }} />,
  completed: <CheckCircleIcon style={{ width: '16px', height: '16px' }} />,
  failed: <XCircleIcon style={{ width: '16px', height: '16px' }} />
};

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px 24px' }}>
      <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '32px', fontWeight: '800', color: color || '#f9fafb' }}>{value}</p>
      {sub && <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchScans = async () => {
    try {
      const res = await api.get('/api/scans');
      setScans(res.data.scans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this scan?')) return;
    try {
      await api.delete(`/scans/${id}`);
      setScans(prev => prev.filter(s => s._id !== id));
    } catch (err) {}
  };

  const totalVulns = scans.reduce((a, s) => a + (s.summary?.total || 0), 0);
  const criticals = scans.reduce((a, s) => a + (s.summary?.critical || 0), 0);
  const completed = scans.filter(s => s.status === 'completed').length;

  const handleRowClick = (scan) => {
    if (scan.status === 'running' || scan.status === 'queued') {
      navigate(`/scan/${scan._id}/progress`);
    } else if (scan.status === 'completed') {
      navigate(`/scan/${scan._id}/results`);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px' }} className="animate-fade-in-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#f9fafb', marginBottom: '6px' }}>Security Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Welcome back, <span style={{ color: '#93c5fd' }}>{user?.email}</span></p>
        </div>
        <Link to="/scan/new">
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            <PlusCircleIcon style={{ width: '18px', height: '18px' }} />
            New Scan
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Scans" value={scans.length} />
        <StatCard label="Completed" value={completed} color="#22c55e" />
        <StatCard label="Vulnerabilities Found" value={totalVulns} color="#f59e0b" />
        <StatCard label="Critical Issues" value={criticals} color="#ef4444" />
      </div>

      {/* Scan History Table */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldExclamationIcon style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f9fafb' }}>Scan History</h2>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading scans...</div>
        ) : scans.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <ShieldExclamationIcon style={{ width: '48px', height: '48px', color: '#374151', margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '16px' }}>No scans yet. Start your first scan!</p>
            <Link to="/scan/new">
              <button style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Start Scanning
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Target URL', 'Status', 'Progress', 'Vulns', 'Critical', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((scan, i) => (
                  <tr key={scan._id} onClick={() => handleRowClick(scan)} style={{
                    borderTop: '1px solid #1f2937', cursor: (scan.status === 'completed' || scan.status === 'running' || scan.status === 'queued') ? 'pointer' : 'default',
                    transition: 'background 0.15s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1f2937'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                      <span style={{ color: '#93c5fd', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{scan.url}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: `${STATUS_COLORS[scan.status]}22`, color: STATUS_COLORS[scan.status], border: `1px solid ${STATUS_COLORS[scan.status]}44` }}>
                        {STATUS_ICONS[scan.status]}
                        {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '4px', background: '#1f2937', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${scan.progress || 0}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '2px', transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>{scan.progress || 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#fbbf24', fontWeight: '600', fontSize: '14px' }}>{scan.summary?.total || 0}</td>
                    <td style={{ padding: '14px 16px', color: '#f87171', fontWeight: '600', fontSize: '14px' }}>{scan.summary?.critical || 0}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '13px' }}>
                      {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={(e) => handleDelete(scan._id, e)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#f87171', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                        <TrashIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
