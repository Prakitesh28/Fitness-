import clsx from 'clsx';

export default function Card({ className, children, onClick, ...props }) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'card p-4 transition-colors duration-300 text-left w-full',
        onClick && 'cursor-pointer hover:border-[var(--border-strong)]',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
