import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Navbar() {
  const { logout, isDark, setTheme } = useAuthStore();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="font-bold">FitTrack</div>
        <nav className="flex gap-2 text-sm">
          {['/dashboard','/workouts','/metrics','/nutrition','/profile'].map((to)=><NavLink key={to} className="rounded px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" to={to}>{to.replace('/','')}</NavLink>)}
        </nav>
        <div className="flex gap-2">
          <button className="rounded border px-2" onClick={() => setTheme(!isDark)}>{isDark ? 'Light' : 'Dark'}</button>
          <button className="rounded border px-2" onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
