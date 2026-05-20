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
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <svg viewBox="0 0 512 512" className="h-8 w-8 fill-[var(--accent)]">
              <path d="M256 32c-35 38-75 58-121 61 27 21 44 49 51 83-42-14-82-12-122 7 28 11 47 30 57 56-38 5-78 24-121 58 80-8 150 11 210 56 60-45 130-64 210-56-43-34-83-53-121-58 10-26 29-45 57-56-40-19-80-21-122-7 7-34 24-62 51-83-46-3-86-23-121-61z" />
            </svg>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-secondary)]">APEX</p>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">{user?.name ?? 'APEX'}</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 sm:flex">
          {links.map((to) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`
              }
            >
              {to.replace('/', '')}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-[var(--accent)] px-3 py-2 text-sm text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
            onClick={() => setTheme(!isDark)}
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            className="rounded-full border border-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
