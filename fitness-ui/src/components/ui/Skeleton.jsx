export default function Skeleton({ className = 'h-24' }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-[rgba(255,255,255,0.02)] via-[rgba(220,20,60,0.04)] to-[rgba(0,0,0,0.2)] ${className}`}
    />
  );
}
