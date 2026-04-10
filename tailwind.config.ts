import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'Noto Sans KR', 'sans-serif'],
      },
      colors: {
        warm: {
          50: '#faf9f7',
          100: '#f3f1ed',
          200: '#e8e4dd',
          300: '#d5d0c6',
          400: '#b5ae9f',
          500: '#968e7e',
          600: '#7a7265',
          700: '#635c51',
          800: '#524c43',
          900: '#2d2a25',
          950: '#1a1815',
        },
        coral: {
          50: '#fff5f0',
          100: '#ffe8db',
          200: '#ffd0b5',
          300: '#ffb088',
          400: '#ff8a55',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      boxShadow: {
        'warm': '0 4px 6px -1px rgba(45, 42, 37, 0.07), 0 2px 4px -2px rgba(45, 42, 37, 0.05)',
        'warm-lg': '0 10px 15px -3px rgba(45, 42, 37, 0.08), 0 4px 6px -4px rgba(45, 42, 37, 0.04)',
        'warm-xl': '0 20px 25px -5px rgba(45, 42, 37, 0.08), 0 8px 10px -6px rgba(45, 42, 37, 0.04)',
        'indigo': '0 4px 14px 0 rgba(79, 70, 229, 0.25)',
        'coral': '0 4px 14px 0 rgba(249, 115, 22, 0.25)',
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.6s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'gradient': 'gradient-shift 4s ease infinite',
      },
    },
  },
  plugins: [],
};

export default config;
