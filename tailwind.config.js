module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'weather-primary': '#0369a1',
        'weather-secondary': '#0ea5e9',
        'weather-sunny': '#f59e0b',
        'weather-rain': '#1e40af',
        'weather-snow': '#e0f2fe',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      backgroundImage: {
        'weather-gradient': 'linear-gradient(to bottom right, #0ea5e9, #7dd3fc)',
      },
      fontFamily: {
        sans: ['Inter var', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'weather-card': '0 8px 32px rgba(14, 165, 233, 0.15)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}