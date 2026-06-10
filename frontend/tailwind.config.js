/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#38acf7',
          500: '#0e91e9',
          600: '#0273c5',
          700: '#035ca1',
          800: '#074e85',
          900: '#0c426e',
          950: '#082a4a',
        },
        calm: {
          50: '#f5f8fa',
          100: '#ebf1f5',
          200: '#d1e0eb',
          300: '#a8c6db',
          400: '#78a6c7',
          500: '#5487af',
          600: '#416d93',
          700: '#355877',
          800: '#2f4b63',
          900: '#2b4154',
          950: '#1c2937',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
