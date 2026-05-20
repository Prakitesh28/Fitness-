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
    <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.03)] bg-matte/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 text-white font-display shadow-glow">FT</div>
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
                    ? 'bg-[rgba(220,20,60,0.08)] text-white shadow-glow'
                    : 'text-slate-300 hover:bg-[rgba(255,255,255,0.02)] hover:text-white'
                }`
              }
            >
              {to.replace('/', '')}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="rounded-2xl border border-[rgba(255,255,255,0.03)] bg-panel px-3 py-2 text-sm text-slate-200 transition hover:bg-[rgba(255,255,255,0.02)]"
            onClick={() => setTheme(!isDark)}
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            className="rounded-2xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-90 shadow-glow"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
