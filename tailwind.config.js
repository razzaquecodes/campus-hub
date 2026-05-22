/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#050506',
        surface: '#0C0C0F',
        'surface-elevated': '#121218',
        border: 'rgba(255, 255, 255, 0.06)',
        'border-strong': 'rgba(255, 255, 255, 0.12)',
        primary: '#7C6CF6',
        'primary-light': '#A89BFF',
        accent: '#38BDF8',
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#F87171',
        muted: '#71717A',
        'text-primary': '#FAFAFA',
        'text-secondary': '#A1A1AA',
        'text-tertiary': '#71717A',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
