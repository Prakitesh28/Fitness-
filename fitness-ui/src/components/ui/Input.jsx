import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'input-surface w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition duration-200 placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(220,20,60,0.12)]',
        className
      )}
      {...props}
    />
  );
});

export default Input;
