/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdeeee',
          100: '#f9d4d9',
          300: '#e14b5a',
          500: '#DC143C', // primary crimson
          600: '#b30f31',
          700: '#8a0b28',
        },
        panel: {
          DEFAULT: '#0f1113', // deep charcoal
          600: '#0b0c0d',
        },
        matte: {
          DEFAULT: '#070708', // matte black
        },
      },
      fontFamily: {
        display: ['"VFC Fantomen"', 'ui-serif', 'Georgia', 'serif'],
        body: ['Inter', 'Manrope', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glow: '0 8px 30px rgba(220,20,60,0.18), 0 2px 6px rgba(0,0,0,0.6)',
        'inner-soft': 'inset 0 1px 0 rgba(255,255,255,0.02)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
