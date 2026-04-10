'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, clearSession } from '@/lib/storage';

const NavIcon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ShieldLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" fill="rgba(201,8,42,0.2)" stroke="var(--color-red)" strokeWidth="1.5"/>
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '/workouts', label: 'Training', icon: 'M6.5 6.5h11M6.5 12h11M6.5 17.5h11M2 6.5h1M2 12h1M2 17.5h1' },
  { href: '/nutrition', label: 'Nutrition', icon: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3' },
  { href: '/goals', label: 'Mission Goals', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3' },
  { href: '/profile', label: 'Agent Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    setUser(session);
  }, [pathname]);

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  if (!user) return null;

  const avatarInitial = user.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(4px)' }}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Top: Brand */}
        <div className="sidebar-logo">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <ShieldLogo />
            </div>
            <div>
              <div className="sidebar-brand-name">AVENGERS</div>
              <div className="sidebar-brand-sub">Training Protocol</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Operations</div>
          {navItems.map((item) => (
            <button
              key={item.href}
              className={`nav-item w-full ${pathname === item.href ? 'active' : ''}`}
              onClick={() => { router.push(item.href); setMobileOpen(false); }}
            >
              <NavIcon d={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}

          <div className="nav-section-label" style={{ marginTop: '1rem' }}>System</div>
          <button
            className="nav-item w-full"
            onClick={handleLogout}
            style={{ color: 'var(--color-red)', opacity: 0.7 }}
          >
            <NavIcon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            <span>Logout</span>
          </button>
        </nav>

        {/* Bottom: User */}
        <div className="sidebar-user">
          <div className="sidebar-user-card">
            <div className="user-avatar">{avatarInitial}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || 'Agent'}
              </div>
              <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="status-dot status-online"></span>
                {user.heroClass || 'Recruit'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(v => !v)}
        style={{
          position: 'fixed', top: '1rem', left: '1rem', zIndex: 200,
          display: 'none', padding: '0.5rem', background: 'var(--bg-secondary)',
          border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
        }}
        className="mobile-hamburger"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </>
  );
}
