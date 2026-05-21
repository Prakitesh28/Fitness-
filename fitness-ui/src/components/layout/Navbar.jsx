import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

const links = ['/dashboard', '/workouts', '/templates', '/metrics', '/nutrition', '/profile'];

export default function Navbar({ onToggleSidebar } ) {
  const { logout, isDark, setTheme, user } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle sidebar"
            onClick={() => onToggleSidebar && onToggleSidebar(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)] md:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <svg viewBox="0 0 512 512" className="h-8 w-8 fill-[var(--accent)]">
              <path d="M256 32c-35 38-75 58-121 61 27 21 44 49 51 83-42-14-82-12-122 7 28 11 47 30 57 56-38 5-78 24-121 58 80-8 150 11 210 56 60-45 130-64 210-56-43-34-83-53-121-58 10-26 29-45 57-56-40-19-80-21-122-7 7-34 24-62 51-83-46-3-86-23-121-61z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[var(--accent)]"><path d="M12 2C9.8 6 4 7 4 10c0 2 4 3 8 3s8-1 8-3c0-3-5.8-4-8-8z"/></svg>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)]">APEX</p>
            </div>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">{user?.name ?? 'APEX'}</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 sm:flex">
          {links.map((to) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                text-[0.875rem] font-normal tracking-[0.02em] transition-all duration-200 px-[16px] py-[6px]
                ${isActive
                  ? 'bg-[#DC143C] text-white rounded-[6px]'
                  : 'text-[#7a7a9a] hover:text-white'
                }
              `}
            >
              {to.replace('/', '').toLowerCase()}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            className="rounded-full border border-[var(--accent)] px-3 py-2 text-sm text-[var(--accent)] transition active:bg-[var(--accent)] active:text-white"
            onClick={() => setTheme(!isDark)}
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            className="rounded-full border border-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent)] transition active:bg-[var(--accent)] active:text-white"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
        <div className="sm:hidden flex items-center gap-2">
          <button type="button" aria-label="Open menu" onClick={() => setMobileOpen(!mobileOpen)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="sm:hidden z-40 w-full border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            {links.map((to) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `
                block px-4 py-3 text-[0.875rem] font-normal tracking-[0.02em] transition-all duration-200
                ${isActive
                  ? 'border-l-[3px] border-l-[#DC143C] bg-[rgba(220,20,60,0.08)] text-white pl-[12px]'
                  : 'text-[#7a7a9a] hover:text-white'
                }
              `}>
                {to.replace('/', '').toLowerCase()}
              </NavLink>
            ))}
            <button className="w-full rounded-md border border-[var(--border)] px-4 py-3 text-left text-[var(--text-primary)]" onClick={() => { setTheme(!isDark); setMobileOpen(false); }}>{isDark ? 'Light' : 'Dark'}</button>
            <button className="w-full rounded-md border border-[var(--border)] px-4 py-3 text-left text-[var(--text-primary)]" onClick={() => { handleLogout(); setMobileOpen(false); }}>Logout</button>
          </div>
        </div>
      )}
    </header>
  );
}
