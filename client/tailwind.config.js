/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        bg: {
          base: '#090909',
          card: '#161616',
          sidebar: '#111111',
          elevated: '#1E1E1E',
        },
        // Borders
        border: {
          DEFAULT: '#2A2A2A',
          subtle: '#1F1F1F',
          strong: '#3A3A3A',
        },
        // Orange primary
        orange: {
          50: '#FFF3E8',
          100: '#FFE0C2',
          200: '#FFC490',
          300: '#FFA05E',
          400: '#FF7D2C',
          500: '#FF6A00',
          600: '#E55F00',
          700: '#CC5400',
          800: '#A84400',
          900: '#7A3100',
        },
        // Status colors
        success: '#00C853',
        warning: '#FFC107',
        danger: '#FF3B30',
        info: '#007AFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'counter': 'counter 1s ease-out',
        'scan-line': 'scanLine 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255, 106, 0, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 106, 0, 0.6)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255, 106, 0, 0.3)',
        'glow-orange-sm': '0 0 10px rgba(255, 106, 0, 0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.6)',
        'modal': '0 25px 50px rgba(0,0,0,0.8)',
      },
    },
  },
  plugins: [],
}
