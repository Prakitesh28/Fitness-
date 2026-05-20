import clsx from 'clsx';
export default function Button({ className, children, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition duration-200 hover:brightness-90 focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
