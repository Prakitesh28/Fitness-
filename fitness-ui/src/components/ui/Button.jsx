import clsx from 'clsx';
export default function Button({ className, children, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--accent)] transition duration-200 hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
