import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ShieldCheckIcon, SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const btnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)',
    background: 'var(--surface-2)', color: 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0
  };

  return (
    <nav style={{
      background: 'var(--nav-bg)', backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-soft)',
      position: 'sticky', top: 0, zIndex: 50, transition: 'background 0.25s, border-color 0.25s'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

          {/* Logo */}
          <Link to={user ? '/dashboard' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <ShieldCheckIcon style={{ width: '30px', height: '30px', color: 'var(--accent)' }} />
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.3px' }}>
              VulnScanner
            </span>
          </Link>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Theme toggle */}
            <button onClick={toggleTheme} style={btnStyle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light'
                ? <MoonIcon style={{ width: '17px', height: '17px' }} />
                : <SunIcon style={{ width: '17px', height: '17px', color: '#fbbf24' }} />
              }
            </button>

            {user && (
              <>
                <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                  Dashboard
                </Link>
                <Link to="/scan/new" style={{ textDecoration: 'none' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
                    <PlusCircleIcon style={{ width: '16px', height: '16px' }} />
                    New Scan
                  </button>
                </Link>

                {/* Avatar / username */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {user.avatar
                    ? <img src={user.avatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border)' }} />
                    : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                  }
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>@{user.username}</span>
                </div>

                <button onClick={handleLogout} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
