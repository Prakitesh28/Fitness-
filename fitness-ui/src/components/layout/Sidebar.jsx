import { NavLink } from 'react-router-dom';

const links = [
  '/dashboard',
  '/workouts',
  '/metrics',
  '/nutrition',
  '/profile',
  '/looks'
];

export default function Sidebar({ onClose }) {
  return (
    <aside className="w-64 min-h-screen bg-[#0f0f17] border-r border-[#1f1f2b]">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-8">
          Apex Fitness
        </h1>

        <div>
          {links.map((to) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `block px-4 py-3 text-[0.875rem] font-normal tracking-[0.02em] transition-all duration-200 ${
                  isActive
                    ? 'border-l-[3px] border-l-[#DC143C] bg-[rgba(220,20,60,0.08)] text-white pl-[12px]'
                    : 'text-[#7a7a9a] hover:text-white'
                }`
              }
            >
              {to.replace('/', '').toLowerCase()}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}