/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#E8A6A1', // Soft Coral Pink
        secondary: '#A8D1DA', // Muted Aqua Blue
        background: '#FAF9F6', // Light Cream
        accent: '#90CAD6', // Accent/CTA
        text: '#2D2D2D', // Dark grey
        success: '#A1D9B2',
        error: '#FF6961',
      },
    },
  },
  plugins: [],
};
