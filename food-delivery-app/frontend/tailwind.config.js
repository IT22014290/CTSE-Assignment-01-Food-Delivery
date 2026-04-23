/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slateBrand: '#0f172a',
        coral: '#fb7185',
        mango: '#f59e0b',
        mint: '#34d399'
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Manrope', 'sans-serif']
      },
      boxShadow: {
        glow: '0 10px 30px -10px rgba(251, 113, 133, 0.35)'
      }
    }
  },
  plugins: []
};
