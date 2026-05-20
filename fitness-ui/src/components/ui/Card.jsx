import clsx from 'clsx';
export default function Card({ className, children }) {
  return (
    <div
      className={clsx(
        'rounded-[1.5rem] border border-[rgba(220,20,60,0.06)] bg-panel p-4 shadow-glow backdrop-blur-xs transition-colors duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}
