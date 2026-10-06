import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const NAV_LINKS = {
  donor:     [{ to: '/', label: '🏠 Home' }, { to: '/map', label: '🗺️ Map' }, { to: '/chatbot', label: '🤖 Eligibility' }, { to: '/profile', label: '👤 Profile' }],
  recipient: [{ to: '/', label: '🏠 Home' }, { to: '/request/new', label: '➕ Request' }, { to: '/map', label: '🗺️ Map' }, { to: '/profile', label: '👤 Profile' }],
  hospital:  [{ to: '/', label: '🏠 Home' }, { to: '/map', label: '🗺️ Map' }, { to: '/profile', label: '👤 Profile' }],
  admin:     [{ to: '/', label: '🏠 Home' }, { to: '/map', label: '🗺️ Map' }],
  ngo:       [{ to: '/', label: '🏠 Home' }, { to: '/map', label: '🗺️ Map' }]
};

const ROLE_COLORS = {
  donor: '#ff2d55', recipient: '#0a84ff', hospital: '#30d158', admin: '#ffd60a', ngo: '#bf5af2'
};

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector(s => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!token) return null;

  const links = NAV_LINKS[user?.role] || [];
  const roleColor = ROLE_COLORS[user?.role] || '#ff2d55';

  const handleLogout = () => { dispatch(logout()); navigate('/login'); setMenuOpen(false); };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-username { display: none !important; }
          .nav-role-pill { display: none !important; }
        }
      `}</style>
      <nav style={S.nav}>
        <div style={S.inner}>
          <Link to="/" style={S.brand} onClick={() => setMenuOpen(false)}>
            <span style={S.brandIcon}>🩸</span>
            <span style={S.brandText}>Hemora</span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links" style={S.links}>
            {links.map(l => (
              <Link key={l.to} to={l.to} style={{ ...S.link, ...(location.pathname === l.to ? S.linkActive : {}) }}>
                {l.label}
                {location.pathname === l.to && <span style={S.linkDot} />}
              </Link>
            ))}
          </div>

          <div style={S.right}>
            <div className="nav-role-pill" style={{ ...S.rolePill, background: roleColor + '20', border: '1px solid ' + roleColor + '40', color: roleColor }}>
              {user?.role?.toUpperCase()}
            </div>
            <div style={S.userInfo}>
              <div style={{ ...S.avatar, background: roleColor }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="nav-username" style={S.userName}>{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={handleLogout} style={S.logoutBtn} className="hide-on-mobile">Sign out</button>
            {/* Hamburger */}
            <button className="nav-hamburger" style={S.hamburger} onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={S.mobileMenu}>
            {links.map(l => (
              <Link key={l.to} to={l.to}
                style={{ ...S.mobileLink, ...(location.pathname === l.to ? S.mobileLinkActive : {}) }}
                onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div style={S.mobileDivider} />
            <div style={S.mobileUser}>
              <div style={{ ...S.avatar, background: roleColor, width: 28, height: 28, fontSize: 12 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{user?.name}</span>
              <span style={{ ...S.rolePill, background: roleColor + '20', color: roleColor, marginLeft: 'auto', fontSize: 10 }}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <button onClick={handleLogout} style={S.mobileLogout}>Sign out</button>
          </div>
        )}
      </nav>
    </>
  );
}

const S = {
  nav: { position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 8, padding: '0 20px' },
  brand: { display: 'flex', alignItems: 'center', gap: 8, marginRight: 20, textDecoration: 'none', flexShrink: 0 },
  brandIcon: { fontSize: 22 },
  brandText: { fontSize: 17, fontWeight: 800, color: 'white' },
  links: { gap: 2, flex: 1, display: 'flex' },
  link: { padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'color 0.2s' },
  linkActive: { color: 'white', background: 'rgba(255,255,255,0.07)' },
  linkDot: { width: 4, height: 4, borderRadius: '50%', background: '#ff2d55' },
  right: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  rolePill: { padding: '3px 10px', borderRadius: 50, fontSize: 10, fontWeight: 800, letterSpacing: 1 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  logoutBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
  hamburger: { display: 'none', background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer', padding: '4px 8px', alignItems: 'center', justifyContent: 'center' },
  mobileMenu: { background: 'rgba(10,10,15,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px 16px' },
  mobileLink: { display: 'block', padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginBottom: 4 },
  mobileLinkActive: { color: 'white', background: 'rgba(255,255,255,0.07)' },
  mobileDivider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' },
  mobileUser: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', marginBottom: 8 },
  mobileLogout: { width: '100%', padding: '11px', background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.2)', color: '#ff2d55', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }
};
