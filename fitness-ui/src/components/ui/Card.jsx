import clsx from 'clsx';
export default function Card({ className, children }) {
  return (
    <div
      className={clsx(
        'card p-4 transition-colors duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}
