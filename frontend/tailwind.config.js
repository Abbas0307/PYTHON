/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mindora: {
          primary: '#6D5CE8',
          darkViolet: '#4936B5',
          lightViolet: '#F1EEFF',
          bg: '#F8F9FC',
          mainText: '#202033',
          secondaryText: '#77788C',
          white: '#FFFFFF',
          secondary: '#8B5CF6',
          lavender: '#F1EEFF',
          lavenderDark: '#E4D5FF',
          surface: '#F8F9FC',
          darkText: '#202033',
          mutedText: '#77788C',
          border: 'rgba(109, 92, 232, 0.16)',
          accentPink: '#EC4899',
          accentEmerald: '#10B981',
          accentAmber: '#F59E0B',
          accentRose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
      },
      boxShadow: {
        'soft': '0 12px 32px rgba(109, 92, 232, 0.06)',
        'card': '0 8px 24px rgba(109, 92, 232, 0.08)',
        'hover': '0 20px 40px rgba(109, 92, 232, 0.12)',
        'glow': '0 0 24px rgba(109, 92, 232, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}

