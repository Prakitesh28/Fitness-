/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#DC143C',   // Core cinematic red
          dark: '#8B0000',      // Deep structural accent red
          glow: 'rgba(220, 20, 60, 0.15)', // Light-bleed utility
        },
        panel: {
          DEFAULT: 'rgba(5, 0, 0, 0.85)', // High-contrast transparent charcoal black
          solid: '#0a0b0c',              // Fallback solid panel black
        },
        matte: {
          DEFAULT: '#000000',   // True pitch black void
        },
      },
      fontFamily: {
        display: ['"VFC Fantomen"', 'Oswald', 'Impact', 'sans-serif'], 
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'], // For tactical numbers
      },
      boxShadow: {
        glow: '0 8px 30px rgba(220, 20, 60, 0.25), 0 2px 6px rgba(0, 0, 0, 0.8)',
        tactical: '0 10px 30px rgba(0, 0, 0, 0.9), inset 0 0 15px rgba(220, 20, 60, 0.05)',
      },
    },
  },
  plugins: [],
};