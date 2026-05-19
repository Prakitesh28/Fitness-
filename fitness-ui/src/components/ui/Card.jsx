import clsx from 'clsx';
export default function Card({ className, children }) { return <div className={clsx('rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900', className)}>{children}</div>; }
