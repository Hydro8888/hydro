import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy tokens (kept for backward compatibility)
        primary: '#1a73e8',
        dark: '#1a1a2e',
        light: '#f8f9fa',

        // Semantic surface colors — dark modern palette
        surface: {
          DEFAULT: '#0d1117',
          card: '#161b22',
          elevated: '#21262d',
        },
        text: {
          DEFAULT: '#e6edf3',
          secondary: '#8b949e',
          muted: '#484f58',
        },
        accent: {
          DEFAULT: '#f0883e',
          blue: '#58a6ff',
          red: '#f85149',
          green: '#3fb950',
        },
        border: {
          DEFAULT: '#30363d',
          muted: '#21262d',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard', '-apple-system', 'BlinkMacSystemFont',
          'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial',
          'Noto Sans KR', 'sans-serif',
        ],
      },
      fontSize: {
        'headline-xl': ['2.5rem', { lineHeight: '1.15', fontWeight: '800' }],
        'headline-lg': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }],
        'headline-sm': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
        'overline': ['0.6875rem', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        elevated: '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
        dropdown: '0 8px 24px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        card: '0.5rem',
        badge: '0.25rem',
        pill: '9999px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'bookmark-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'bookmark-pop': 'bookmark-pop 0.3s ease-out',
        'toast-in': 'toast-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
