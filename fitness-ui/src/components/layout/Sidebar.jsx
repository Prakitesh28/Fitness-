import { NavLink } from 'react-router-dom';

const links = ['/dashboard', '/workouts', '/metrics', '/nutrition', '/profile'];

export default function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-96px)] rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 lg:block">
      <div className="mb-6 space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="sidebar-label">TRACKING</p>
        <h2 className="text-2xl font-semibold text-[var(--accent)]">CONTROL CENTER</h2>
      </div>
      <div className="space-y-2">
        {links.map((to) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-[var(--accent-dim)] border-l-4 border-[var(--accent)] text-white pl-3'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`
            }
          >
            {to.replace('/', '')}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
