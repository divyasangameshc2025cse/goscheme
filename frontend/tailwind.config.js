/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0F172A', light: '#1E293B' },
        royal: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF' },
        teal: { DEFAULT: '#0D9488', hover: '#0F766E', light: '#F0FDFA' },
        emerald: { DEFAULT: '#10B981', hover: '#059669', light: '#ECFDF5' },
        amber: { DEFAULT: '#F59E0B', light: '#FFFBEB' },
        rose: { DEFAULT: '#F43F5E', light: '#FFF1F2' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl2: '24px',
      },
    },
  },
  plugins: [],
};
