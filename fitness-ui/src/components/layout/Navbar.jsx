import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const links = ['/dashboard', '/workouts', '/metrics', '/nutrition', '/profile'];

export default function Navbar() {
  const { logout, isDark, setTheme, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-brand-500/20 text-brand-100 font-semibold shadow-glow">FT</div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">FitTrack</p>
            <p className="text-sm font-semibold text-slate-100">{user?.name ?? 'Fitness SaaS'}</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 sm:flex">
          {links.map((to) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-2xl px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-950/30'
                    : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'
                }`
              }
            >
              {to.replace('/', '')}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="rounded-2xl border border-slate-800/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
            onClick={() => setTheme(!isDark)}
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            className="rounded-2xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
