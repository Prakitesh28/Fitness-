import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition duration-200 placeholder:text-slate-500 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20',
        className
      )}
      {...props}
    />
  );
});

export default Input;
