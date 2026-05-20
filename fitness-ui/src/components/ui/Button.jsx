import clsx from 'clsx';
export default function Button({ className, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition duration-200 hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
}
