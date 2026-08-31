/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#181110',        // near-black brown, hero/dark sections
        'ink-soft': '#241A17', // slightly lighter dark panel
        brand: {
          DEFAULT: '#F2650D', // primary orange
          50: '#FEF3EB',
          100: '#FCE9DB',
          200: '#F9D3B7',
          500: '#F2650D',
          600: '#DE590A',
          700: '#B3480A',
        },
        cream: {
          DEFAULT: '#FBE9DC', // category / vin-card / returns section bg
          light: '#FDF0E6',
        },
        muted: '#6E6560', // secondary gray-brown text
        line: '#ECE1D7', // hairline borders on light bg
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.25rem', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
}
