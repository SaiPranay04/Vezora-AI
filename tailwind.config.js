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
        sans: ['Poppins', 'Sora', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Poppins', 'sans-serif'],
      },
      animation: {
        'idle-pulse': 'idlePulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sound-wave': 'soundWave 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        idlePulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.95)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        soundWave: {
          '0%, 100%': { height: '10%' },
          '50%': { height: '100%' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5', boxShadow: '0 0 20px rgba(142, 68, 255, 0.3)' },
          '50%': { opacity: '1', boxShadow: '0 0 40px rgba(142, 68, 255, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      }
    },
  },
  plugins: [],
}
