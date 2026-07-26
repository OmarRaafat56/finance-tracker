/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/**/*.{ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF9', // page background
        surface: '#FFFFFF', // card background
        ink: '#18181B', // primary text
        muted: '#71717A', // secondary text
        subtle: '#A1A1AA', // tertiary text / placeholders
        line: '#E4E4E7', // hairline borders
        'line-strong': '#D4D4D8',
        accent: '#2563EB', // single restrained accent
        'accent-soft': '#EFF4FF',
        positive: '#059669',
        'positive-soft': '#ECFDF5',
        negative: '#DC2626',
        'negative-soft': '#FEF2F2',
      },
      fontSize: {
        xs: ['0.75rem', { letterSpacing: '0.01em' }],
        sm: ['0.8125rem', { letterSpacing: '0.005em' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '8px',
        xl: '10px',
      },
    },
  },
  plugins: [],
};
