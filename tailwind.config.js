/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        primary: '#8E44FF',
        secondary: '#5ED0F3',
        bubble: {
          user: '#1F1B2E',
          ai: '#121C2E',
        },
        text: {
          DEFAULT: '#F5F5F7',
          muted: '#A0A0A0'
        },
        glow: '#E3DFFD',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      animation: {
        'idle-pulse': 'idlePulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sound-wave': 'soundWave 1.5s ease-in-out infinite',
      },
      keyframes: {
        idlePulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        soundWave: {
            '0%, 100%': { height: '10%' },
            '50%': { height: '100%' },
        }
      }
    },
  },
  plugins: [],
}
