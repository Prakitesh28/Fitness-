import clsx from 'clsx';
export default function Button({ className, ...props }) { return <button className={clsx('rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50', className)} {...props} />; }
