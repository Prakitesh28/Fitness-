import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900',
        className
      )}
      {...props}
    />
  );
});

export default Input;
