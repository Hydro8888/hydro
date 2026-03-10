import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        g: {
          blue:    '#1a73e8',
          'blue-d':'#1557b0',
          'blue-l':'#e8f0fe',
          text:    '#202124',
          sub:     '#5f6368',
          muted:   '#80868b',
          border:  '#dadce0',
          bg:      '#f8f9fa',
          red:     '#d93025',
          green:   '#188038',
          'green-l':'#e6f4ea',
          orange:  '#e37400',
          purple:  '#8430ce',
        },
      },
      fontFamily: {
        sans: ['Google Sans', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
