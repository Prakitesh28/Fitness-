import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const QUOTES = [
  "It's not who I am underneath, but what I do that defines me.",
  'Fear is a tool.',
  'Criminals are a superstitious cowardly lot.',
  'The night is darkest just before the dawn.',
  'Training is nothing. The will is everything.',
  'I wear a mask. And that mask is not to hide who I am, but to create who I am.',
  'Why do we fall? So we can learn to pick ourselves up.',
  'You either die a hero, or live long enough to see yourself become the villain.',
];

function pickQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export default function BatLoader({
  fullScreen = true,
  minDuration = 1500,
  maxDuration = 2500,
  onComplete,
  label = 'INITIALISING BATCOMPUTER',
  persistent = false,
}) {
  const quote = useMemo(() => pickQuote(), []);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (persistent) {
      setProgress((p) => (p < 92 ? p + 2 : p));
      const pulse = setInterval(() => {
        setProgress((p) => (p >= 92 ? 28 : p + 4));
      }, 1200);
      return () => clearInterval(pulse);
    }

    const duration = minDuration + Math.random() * (maxDuration - minDuration);
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (elapsed < duration) {
        frame = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 400);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [minDuration, maxDuration, onComplete, persistent]);

  const containerClass = fullScreen
    ? 'fixed inset-0 z-[100] flex items-center justify-center bg-[#050508]'
    : 'flex min-h-[280px] w-full items-center justify-center rounded-3xl bg-[var(--surface)]';

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="bat-loader"
          className={containerClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="relative w-full max-w-2xl px-6 py-10">
            {/* Grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(220,20,60,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(220,20,60,0.15) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Scan line */}
            <motion.div
              className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent shadow-[0_0_20px_rgba(220,20,60,0.8)]"
              initial={{ top: '10%' }}
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative space-y-8 text-center">
              <motion.p
                className="section-label tracking-[0.35em] text-[var(--accent)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {label}
              </motion.p>

              <motion.h1
                className="font-display text-3xl uppercase tracking-widest text-white sm:text-4xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                FitTrack
              </motion.h1>

              <motion.blockquote
                className="mx-auto max-w-lg border-l-2 border-[var(--accent)] pl-4 text-left text-sm italic leading-relaxed text-[var(--text-secondary)] sm:text-base"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                &ldquo;{quote}&rdquo;
              </motion.blockquote>

              <div className="mx-auto max-w-md space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  <span>System scan</span>
                  <span className="text-[var(--accent)]">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#8b0000] via-[var(--accent)] to-[#ff4d6d]"
                    style={{ width: `${progress}%` }}
                    layout
                  />
                </div>
                <div className="flex justify-center gap-1 pt-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1 w-6 rounded-full bg-[var(--accent)]"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Corner HUD brackets */}
            <span className="pointer-events-none absolute left-2 top-2 h-8 w-8 border-l-2 border-t-2 border-[var(--accent)] opacity-60" />
            <span className="pointer-events-none absolute right-2 top-2 h-8 w-8 border-r-2 border-t-2 border-[var(--accent)] opacity-60" />
            <span className="pointer-events-none absolute bottom-2 left-2 h-8 w-8 border-b-2 border-l-2 border-[var(--accent)] opacity-60" />
            <span className="pointer-events-none absolute bottom-2 right-2 h-8 w-8 border-b-2 border-r-2 border-[var(--accent)] opacity-60" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BatLoaderInline({ label }) {
  return <BatLoader fullScreen={false} minDuration={800} maxDuration={1200} label={label} />;
}
