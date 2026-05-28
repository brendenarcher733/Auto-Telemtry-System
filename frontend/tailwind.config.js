/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0a0c14',
          925: '#0d1018',
          900: '#0f1117',
        },
        cyan: { 400: '#22d3ee', 500: '#06b6d4' },
        amber: { 400: '#fbbf24' },
        red:   { 500: '#ef4444' },
        green: { 400: '#4ade80', 500: '#22c55e' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Courier New', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
