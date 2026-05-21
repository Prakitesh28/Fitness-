import clsx from 'clsx';
export default function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-full border transition duration-200 font-semibold disabled:cursor-not-allowed disabled:opacity-60';

  const variantClasses = {
    default: 'border-[var(--accent)] bg-transparent text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white',
    outline: 'border-[var(--accent)] bg-transparent text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white',
    destructive: 'border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent)]/80',
    secondary: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white'
  };

  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1 text-xs',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={clsx(
        base,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
