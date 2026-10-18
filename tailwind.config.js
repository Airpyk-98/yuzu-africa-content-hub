/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yuzu: {
          purple: '#5B2A86',
          magenta: '#D6246E',
          orange: '#F58220',
          yellow: '#FFC20E',
          offwhite: '#FAF7F2',
          charcoal: '#222222',
        }
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
