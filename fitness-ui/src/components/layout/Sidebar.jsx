import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const links = ['/dashboard', '/workouts', '/metrics', '/nutrition', '/profile'];
  return (
    <aside className='hidden w-56 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800 lg:block'>
      <div className='space-y-2'>
        {links.map((to) => (
          <NavLink key={to} to={to} className='block rounded px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800'>
            {to.replace('/', '')}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
