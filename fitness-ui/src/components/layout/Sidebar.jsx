import { NavLink } from 'react-router-dom';

const links = ['/dashboard', '/workouts', '/metrics', '/nutrition', '/profile'];

export default function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-96px)] rounded-2xl border border-[rgba(255,255,255,0.03)] bg-panel p-5 shadow-glow lg:block">
      <div className="mb-6 space-y-2 rounded-2xl bg-[rgba(255,255,255,0.02)] p-4 text-slate-300">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tracking</p>
        <h2 className="text-xl font-semibold text-white">Control Center</h2>
      </div>
      <div className="space-y-2">
        {links.map((to) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-[rgba(220,20,60,0.08)] text-white shadow-glow'
                  : 'text-slate-300 hover:bg-[rgba(255,255,255,0.02)] hover:text-white'
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
