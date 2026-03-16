import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { ShieldCheckIcon, UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, googleAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(username, email || undefined, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(''); setLoading(true);
      try {
        await googleAuth(tokenResponse.access_token);
        navigate('/dashboard');
      } catch (err) {
        setError('Google sign-up failed. Please try registering manually.');
      } finally { setLoading(false); }
    },
    onError: () => setError('Google sign-in was cancelled or failed.'),
    flow: 'implicit',
  });

  const inputStyle = {
    width: '100%', padding: '11px 14px 11px 42px',
    background: 'var(--input-bg)', border: '1px solid var(--input-border)',
    borderRadius: '9px', color: 'var(--text-primary)', fontSize: '14px',
    outline: 'none', transition: 'border 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '420px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', width: '60px', height: '60px', borderRadius: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
            <ShieldCheckIcon style={{ width: '28px', height: '28px', color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Start scanning for vulnerabilities</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--card-shadow)' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', marginBottom: '18px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={() => handleGoogle()} type="button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '11px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '9px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', marginBottom: '16px', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <GoogleIcon />
            Sign up with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-soft)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>or register manually</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-soft)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Username <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                  placeholder="cool_username" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--input-border)'} />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>Letters, numbers and underscores only</p>
            </div>

            {/* Email (optional) */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Email <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <EnvelopeIcon style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--input-border)'} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Min. 6 characters" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--input-border)'} />
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Confirm Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <LockClosedIcon style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Repeat password" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--input-border)'} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', background: loading ? 'var(--border)' : 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
            }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = 'var(--accent)')}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '20px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
