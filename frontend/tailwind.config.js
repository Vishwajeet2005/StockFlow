/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#b9dafd',
          300: '#7cbcfb',
          400: '#3898f6',
          500: '#0e7ae7',
          600: '#025cc4',
          700: '#0249a0',
          800: '#063f84',
          900: '#0b366e',
        },
        surface: {
          0: '#ffffff',
          1: '#f8f9fb',
          2: '#f1f3f6',
          3: '#e8ebf0',
        },
        ink: {
          900: '#0f1117',
          700: '#2d3348',
          500: '#5a6272',
          300: '#9ba3b4',
          100: '#c8cdd8',
        },
      },
    },
  },
  plugins: [],
};
