/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F2937',
          light: '#374151',
        },
        secondary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          light: '#EFF6FF',
        },
        neutral: {
          DEFAULT: '#E5E7EB',
          dark: '#D1D5DB',
          darker: '#9CA3AF',
        },
        success: {
          DEFAULT: '#10B981',
          bg: '#ECFDF5',
          text: '#065F46',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          bg: '#FEF2F2',
          text: '#7F1D1D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#FFFBEB',
          text: '#78350F',
        },
        info: {
          DEFAULT: '#3B82F6',
          bg: '#EFF6FF',
          text: '#1E40AF',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'San Francisco', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1)',
        modal: '0 20px 25px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
