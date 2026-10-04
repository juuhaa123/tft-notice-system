/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          DEFAULT: '#0cefd3',
          dark: '#0a9d88',
          light: '#4fffff',
        },
        text: {
          primary: '#232324',
          secondary: '#6c6d6f',
          muted: '#b1b3b5',
          inverse: '#ffffff',
        },
        bg: {
          primary: '#ffffff',
          secondary: '#f3f4f5',
          tertiary: '#f6f6f6',
        },
      },
      fontSize: {
        h1: ['60px', { lineHeight: '84px', fontWeight: '800' }],
        h2: ['24px', { lineHeight: 'normal', fontWeight: '700' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        label: ['14px', { lineHeight: '21px', fontWeight: '400' }],
        button: ['16px', { lineHeight: '22.4px', fontWeight: '700' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
