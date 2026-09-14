/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Work Sans"', 'system-ui', 'sans-serif']
      },
      colors: {
        // Warm paper base — a workshop-ledger feel, not the generic AI cream.
        paper: '#F1E9DC',
        ink: '#2A2420',
        line: '#D9CBB4',
        // Yogart Gallery: deep maroon + muted gold, temple-frame palette.
        yogart: {
          DEFAULT: '#7A1F2B',
          dark: '#5A1620',
          gold: '#B8863B'
        },
        // MK Creations: marigold + festive red, Rakhi/Diwali palette.
        mk: {
          DEFAULT: '#C4501C',
          dark: '#9C3D14',
          marigold: '#E8A33D'
        }
      }
    }
  },
  plugins: []
}
