import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';

const links = ['/dashboard', '/workouts', '/metrics', '/nutrition', '/profile'];

export default function Sidebar({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen]);

  return (
    <>
      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => onClose && onClose()} />
        <aside className="relative z-50 h-full w-72 rounded-r-2xl border-r border-[var(--border)] bg-[var(--bg)] p-5">
          <div className="mb-6 space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="sidebar-label">TRACKING</p>
            <h2 className="text-2xl font-semibold text-[var(--accent)]">CONTROL CENTER</h2>
          </div>
          <div className="space-y-2">
            {links.map((to) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) => `block px-4 py-3 text-[0.875rem] font-normal tracking-[0.02em] transition-all duration-200 ${isActive ? 'border-l-[3px] border-l-[#DC143C] bg-[rgba(220,20,60,0.08)] text-white pl-[12px]' : 'text-[#7a7a9a] hover:text-white'}`
              >
                {to.replace('/', '').toLowerCase()}
              </NavLink>
            ))}
          </div>
        </aside>
      </div>

      {/* Desktop / tablet */}
      <aside className="hidden lg:block min-h-[calc(100vh-96px)] rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
        <div className="mb-6 space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="sidebar-label">TRACKING</p>
          <h2 className="text-2xl font-semibold text-[var(--accent)]">CONTROL CENTER</h2>
        </div>
        <div className="space-y-2">
          {links.map((to) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `block px-4 py-3 text-[0.875rem] font-normal tracking-[0.02em] transition-all duration-200 ${isActive ? 'border-l-[3px] border-l-[#DC143C] bg-[rgba(220,20,60,0.08)] text-white pl-[12px]' : 'text-[#7a7a9a] hover:text-white'}`
            >
              {to.replace('/', '').toLowerCase()}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto pt-6 text-[var(--text-secondary)] text-xs">Gotham Fitness System v1.0</div>
      </aside>
    </>
  );
}
