// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // QUAN TRỌNG NHẤT LÀ DÒNG NÀY: Phải quét qua tất cả các thư mục con trong src
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        'primary-lime': '#CEF15F',
        'dark-forest': '#133809',
        'neutral-cream': '#E9E6DB',
        'teal-accent': '#287559',
        'brick-red': '#C24342',
      },
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        title: ['Barlow Condensed', 'sans-serif'],
      }
    },
  },
  plugins: [],
}