import clsx from 'clsx';
export default function Card({ className, children }) {
  return (
    <div
      className={clsx(
        'rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-xl shadow-slate-950/10 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/70 dark:bg-slate-900/70',
        className
      )}
    >
      {children}
    </div>
  );
}
