import { NavLink } from 'react-router-dom';

const links = ['/dashboard', '/workouts', '/metrics', '/nutrition', '/profile'];

export default function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-96px)] rounded-3xl border border-slate-800/70 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/20 lg:block">
      <div className="mb-6 space-y-2 rounded-3xl bg-slate-900/80 p-4 text-slate-300 shadow-inner shadow-slate-950/10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tracking</p>
        <h2 className="text-xl font-semibold text-white">Your active analytics</h2>
      </div>
      <div className="space-y-2">
        {links.map((to) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block rounded-3xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-500/20 text-white shadow-lg shadow-brand-500/10'
                  : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'
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
